const version = "14.7.77";

const createExtendedExponentialRampToValueAutomationEvent = (value, endTime, insertTime) => {
    return { endTime, insertTime, type: 'exponentialRampToValue', value };
};

const createExtendedLinearRampToValueAutomationEvent = (value, endTime, insertTime) => {
    return { endTime, insertTime, type: 'linearRampToValue', value };
};

const createSetValueAutomationEvent = (value, startTime) => {
    return { startTime, type: 'setValue', value };
};

const createSetValueCurveAutomationEvent = (values, startTime, duration) => {
    return { duration, startTime, type: 'setValueCurve', values };
};

const getTargetValueAtTime = (time, valueAtStartTime, { startTime, target, timeConstant }) => {
    return target + (valueAtStartTime - target) * Math.exp((startTime - time) / timeConstant);
};

const isExponentialRampToValueAutomationEvent = (automationEvent) => {
    return automationEvent.type === 'exponentialRampToValue';
};

const isLinearRampToValueAutomationEvent = (automationEvent) => {
    return automationEvent.type === 'linearRampToValue';
};

const isAnyRampToValueAutomationEvent = (automationEvent) => {
    return isExponentialRampToValueAutomationEvent(automationEvent) || isLinearRampToValueAutomationEvent(automationEvent);
};

const isSetValueAutomationEvent = (automationEvent) => {
    return automationEvent.type === 'setValue';
};

const isSetValueCurveAutomationEvent = (automationEvent) => {
    return automationEvent.type === 'setValueCurve';
};

const getValueOfAutomationEventAtIndexAtTime = (automationEvents, index, time, defaultValue) => {
    const automationEvent = automationEvents[index];
    return automationEvent === undefined
        ? defaultValue
        : isAnyRampToValueAutomationEvent(automationEvent) || isSetValueAutomationEvent(automationEvent)
            ? automationEvent.value
            : isSetValueCurveAutomationEvent(automationEvent)
                ? automationEvent.values[automationEvent.values.length - 1]
                : getTargetValueAtTime(time, getValueOfAutomationEventAtIndexAtTime(automationEvents, index - 1, automationEvent.startTime, defaultValue), automationEvent);
};

const getEndTimeAndValueOfPreviousAutomationEvent = (automationEvents, index, currentAutomationEvent, nextAutomationEvent, defaultValue) => {
    return currentAutomationEvent === undefined
        ? [nextAutomationEvent.insertTime, defaultValue]
        : isAnyRampToValueAutomationEvent(currentAutomationEvent)
            ? [currentAutomationEvent.endTime, currentAutomationEvent.value]
            : isSetValueAutomationEvent(currentAutomationEvent)
                ? [currentAutomationEvent.startTime, currentAutomationEvent.value]
                : isSetValueCurveAutomationEvent(currentAutomationEvent)
                    ? [
                        currentAutomationEvent.startTime + currentAutomationEvent.duration,
                        currentAutomationEvent.values[currentAutomationEvent.values.length - 1]
                    ]
                    : [
                        currentAutomationEvent.startTime,
                        getValueOfAutomationEventAtIndexAtTime(automationEvents, index - 1, currentAutomationEvent.startTime, defaultValue)
                    ];
};

const isCancelAndHoldAutomationEvent = (automationEvent) => {
    return automationEvent.type === 'cancelAndHold';
};

const isCancelScheduledValuesAutomationEvent = (automationEvent) => {
    return automationEvent.type === 'cancelScheduledValues';
};

const getEventTime = (automationEvent) => {
    if (isCancelAndHoldAutomationEvent(automationEvent) || isCancelScheduledValuesAutomationEvent(automationEvent)) {
        return automationEvent.cancelTime;
    }
    if (isExponentialRampToValueAutomationEvent(automationEvent) || isLinearRampToValueAutomationEvent(automationEvent)) {
        return automationEvent.endTime;
    }
    return automationEvent.startTime;
};

const getExponentialRampValueAtTime = (time, startTime, valueAtStartTime, { endTime, value }) => {
    if (valueAtStartTime === value) {
        return value;
    }
    if ((0 < valueAtStartTime && 0 < value) || (valueAtStartTime < 0 && value < 0)) {
        return valueAtStartTime * (value / valueAtStartTime) ** ((time - startTime) / (endTime - startTime));
    }
    return 0;
};

const getLinearRampValueAtTime = (time, startTime, valueAtStartTime, { endTime, value }) => {
    return valueAtStartTime + ((time - startTime) / (endTime - startTime)) * (value - valueAtStartTime);
};

const interpolateValue = (values, theoreticIndex) => {
    const lowerIndex = Math.floor(theoreticIndex);
    const upperIndex = Math.ceil(theoreticIndex);
    if (lowerIndex === upperIndex) {
        return values[lowerIndex];
    }
    return (1 - (theoreticIndex - lowerIndex)) * values[lowerIndex] + (1 - (upperIndex - theoreticIndex)) * values[upperIndex];
};

const getValueCurveValueAtTime = (time, { duration, startTime, values }) => {
    const theoreticIndex = ((time - startTime) / duration) * (values.length - 1);
    return interpolateValue(values, theoreticIndex);
};

const isSetTargetAutomationEvent = (automationEvent) => {
    return automationEvent.type === 'setTarget';
};

class AutomationEventList {
    constructor(defaultValue) {
        this._automationEvents = [];
        this._currenTime = 0;
        this._defaultValue = defaultValue;
    }
    [Symbol.iterator]() {
        return this._automationEvents[Symbol.iterator]();
    }
    add(automationEvent) {
        const eventTime = getEventTime(automationEvent);
        if (isCancelAndHoldAutomationEvent(automationEvent) || isCancelScheduledValuesAutomationEvent(automationEvent)) {
            const index = this._automationEvents.findIndex((currentAutomationEvent) => {
                if (isCancelScheduledValuesAutomationEvent(automationEvent) && isSetValueCurveAutomationEvent(currentAutomationEvent)) {
                    return currentAutomationEvent.startTime + currentAutomationEvent.duration >= eventTime;
                }
                return getEventTime(currentAutomationEvent) >= eventTime;
            });
            const removedAutomationEvent = this._automationEvents[index];
            if (index !== -1) {
                this._automationEvents = this._automationEvents.slice(0, index);
            }
            if (isCancelAndHoldAutomationEvent(automationEvent)) {
                const lastAutomationEvent = this._automationEvents[this._automationEvents.length - 1];
                if (removedAutomationEvent !== undefined && isAnyRampToValueAutomationEvent(removedAutomationEvent)) {
                    if (isSetTargetAutomationEvent(lastAutomationEvent)) {
                        throw new Error('The internal list is malformed.');
                    }
                    const startTime = isSetValueCurveAutomationEvent(lastAutomationEvent)
                        ? lastAutomationEvent.startTime + lastAutomationEvent.duration
                        : getEventTime(lastAutomationEvent);
                    const startValue = isSetValueCurveAutomationEvent(lastAutomationEvent)
                        ? lastAutomationEvent.values[lastAutomationEvent.values.length - 1]
                        : lastAutomationEvent.value;
                    const value = isExponentialRampToValueAutomationEvent(removedAutomationEvent)
                        ? getExponentialRampValueAtTime(eventTime, startTime, startValue, removedAutomationEvent)
                        : getLinearRampValueAtTime(eventTime, startTime, startValue, removedAutomationEvent);
                    const truncatedAutomationEvent = isExponentialRampToValueAutomationEvent(removedAutomationEvent)
                        ? createExtendedExponentialRampToValueAutomationEvent(value, eventTime, this._currenTime)
                        : createExtendedLinearRampToValueAutomationEvent(value, eventTime, this._currenTime);
                    this._automationEvents.push(truncatedAutomationEvent);
                }
                if (lastAutomationEvent !== undefined && isSetTargetAutomationEvent(lastAutomationEvent)) {
                    this._automationEvents.push(createSetValueAutomationEvent(this.getValue(eventTime), eventTime));
                }
                if (lastAutomationEvent !== undefined &&
                    isSetValueCurveAutomationEvent(lastAutomationEvent) &&
                    lastAutomationEvent.startTime + lastAutomationEvent.duration > eventTime) {
                    this._automationEvents[this._automationEvents.length - 1] = createSetValueCurveAutomationEvent(new Float32Array([6, 7]), lastAutomationEvent.startTime, eventTime - lastAutomationEvent.startTime);
                }
            }
        }
        else {
            const index = this._automationEvents.findIndex((currentAutomationEvent) => getEventTime(currentAutomationEvent) > eventTime);
            const previousAutomationEvent = index === -1 ? this._automationEvents[this._automationEvents.length - 1] : this._automationEvents[index - 1];
            if (previousAutomationEvent !== undefined &&
                isSetValueCurveAutomationEvent(previousAutomationEvent) &&
                getEventTime(previousAutomationEvent) + previousAutomationEvent.duration > eventTime) {
                return false;
            }
            const persistentAutomationEvent = isExponentialRampToValueAutomationEvent(automationEvent)
                ? createExtendedExponentialRampToValueAutomationEvent(automationEvent.value, automationEvent.endTime, this._currenTime)
                : isLinearRampToValueAutomationEvent(automationEvent)
                    ? createExtendedLinearRampToValueAutomationEvent(automationEvent.value, eventTime, this._currenTime)
                    : automationEvent;
            if (index === -1) {
                this._automationEvents.push(persistentAutomationEvent);
            }
            else {
                if (isSetValueCurveAutomationEvent(automationEvent) &&
                    eventTime + automationEvent.duration > getEventTime(this._automationEvents[index])) {
                    return false;
                }
                this._automationEvents.splice(index, 0, persistentAutomationEvent);
            }
        }
        return true;
    }
    flush(time) {
        const index = this._automationEvents.findIndex((currentAutomationEvent) => getEventTime(currentAutomationEvent) > time);
        if (index > 1) {
            const remainingAutomationEvents = this._automationEvents.slice(index - 1);
            const firstRemainingAutomationEvent = remainingAutomationEvents[0];
            if (isSetTargetAutomationEvent(firstRemainingAutomationEvent)) {
                remainingAutomationEvents.unshift(createSetValueAutomationEvent(getValueOfAutomationEventAtIndexAtTime(this._automationEvents, index - 2, firstRemainingAutomationEvent.startTime, this._defaultValue), firstRemainingAutomationEvent.startTime));
            }
            this._automationEvents = remainingAutomationEvents;
        }
    }
    getValue(time) {
        if (this._automationEvents.length === 0) {
            return this._defaultValue;
        }
        const indexOfNextEvent = this._automationEvents.findIndex((automationEvent) => getEventTime(automationEvent) > time);
        const nextAutomationEvent = this._automationEvents[indexOfNextEvent];
        const indexOfCurrentEvent = (indexOfNextEvent === -1 ? this._automationEvents.length : indexOfNextEvent) - 1;
        const currentAutomationEvent = this._automationEvents[indexOfCurrentEvent];
        if (currentAutomationEvent !== undefined &&
            isSetTargetAutomationEvent(currentAutomationEvent) &&
            (nextAutomationEvent === undefined ||
                !isAnyRampToValueAutomationEvent(nextAutomationEvent) ||
                nextAutomationEvent.insertTime > time)) {
            return getTargetValueAtTime(time, getValueOfAutomationEventAtIndexAtTime(this._automationEvents, indexOfCurrentEvent - 1, currentAutomationEvent.startTime, this._defaultValue), currentAutomationEvent);
        }
        if (currentAutomationEvent !== undefined &&
            isSetValueAutomationEvent(currentAutomationEvent) &&
            (nextAutomationEvent === undefined || !isAnyRampToValueAutomationEvent(nextAutomationEvent))) {
            return currentAutomationEvent.value;
        }
        if (currentAutomationEvent !== undefined &&
            isSetValueCurveAutomationEvent(currentAutomationEvent) &&
            (nextAutomationEvent === undefined ||
                !isAnyRampToValueAutomationEvent(nextAutomationEvent) ||
                currentAutomationEvent.startTime + currentAutomationEvent.duration > time)) {
            if (time < currentAutomationEvent.startTime + currentAutomationEvent.duration) {
                return getValueCurveValueAtTime(time, currentAutomationEvent);
            }
            return currentAutomationEvent.values[currentAutomationEvent.values.length - 1];
        }
        if (currentAutomationEvent !== undefined &&
            isAnyRampToValueAutomationEvent(currentAutomationEvent) &&
            (nextAutomationEvent === undefined || !isAnyRampToValueAutomationEvent(nextAutomationEvent))) {
            return currentAutomationEvent.value;
        }
        if (nextAutomationEvent !== undefined && isExponentialRampToValueAutomationEvent(nextAutomationEvent)) {
            const [startTime, value] = getEndTimeAndValueOfPreviousAutomationEvent(this._automationEvents, indexOfCurrentEvent, currentAutomationEvent, nextAutomationEvent, this._defaultValue);
            return getExponentialRampValueAtTime(time, startTime, value, nextAutomationEvent);
        }
        if (nextAutomationEvent !== undefined && isLinearRampToValueAutomationEvent(nextAutomationEvent)) {
            const [startTime, value] = getEndTimeAndValueOfPreviousAutomationEvent(this._automationEvents, indexOfCurrentEvent, currentAutomationEvent, nextAutomationEvent, this._defaultValue);
            return getLinearRampValueAtTime(time, startTime, value, nextAutomationEvent);
        }
        return this._defaultValue;
    }
}

const createCancelAndHoldAutomationEvent = (cancelTime) => {
    return { cancelTime, type: 'cancelAndHold' };
};

const createCancelScheduledValuesAutomationEvent = (cancelTime) => {
    return { cancelTime, type: 'cancelScheduledValues' };
};

const createExponentialRampToValueAutomationEvent = (value, endTime) => {
    return { endTime, type: 'exponentialRampToValue', value };
};

const createLinearRampToValueAutomationEvent = (value, endTime) => {
    return { endTime, type: 'linearRampToValue', value };
};

const createSetTargetAutomationEvent = (target, startTime, timeConstant) => {
    return { startTime, target, timeConstant, type: 'setTarget' };
};

const createAbortError = () => new DOMException('', 'AbortError');

const createAddActiveInputConnectionToAudioNode = (insertElementInSet) => {
    return (activeInputs, source, [output, input, eventListener], ignoreDuplicates) => {
        insertElementInSet(activeInputs[input], [source, output, eventListener], (activeInputConnection) => activeInputConnection[0] === source && activeInputConnection[1] === output, ignoreDuplicates);
    };
};

const createAddAudioNodeConnections = (audioNodeConnectionsStore) => {
    return (audioNode, audioNodeRenderer, nativeAudioNode) => {
        const activeInputs = [];
        for (let i = 0; i < nativeAudioNode.numberOfInputs; i += 1) {
            activeInputs.push(new Set());
        }
        audioNodeConnectionsStore.set(audioNode, {
            activeInputs,
            outputs: new Set(),
            passiveInputs: new WeakMap(),
            renderer: audioNodeRenderer
        });
    };
};

const createAddAudioParamConnections = (audioParamConnectionsStore) => {
    return (audioParam, audioParamRenderer) => {
        audioParamConnectionsStore.set(audioParam, { activeInputs: new Set(), passiveInputs: new WeakMap(), renderer: audioParamRenderer });
    };
};

const ACTIVE_AUDIO_NODE_STORE = new WeakSet();
const AUDIO_NODE_CONNECTIONS_STORE = new WeakMap();
const AUDIO_NODE_STORE = new WeakMap();
const AUDIO_PARAM_CONNECTIONS_STORE = new WeakMap();
const AUDIO_PARAM_STORE = new WeakMap();
const CONTEXT_STORE = new WeakMap();
const EVENT_LISTENERS = new WeakMap();
const CYCLE_COUNTERS = new WeakMap();
// This clunky name is borrowed from the spec. :-)
const NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS = new WeakMap();
const NODE_TO_PROCESSOR_MAPS = new WeakMap();

const handler = {
    construct() {
        return handler;
    }
};
const isConstructible = (constructible) => {
    try {
        const proxy = new Proxy(constructible, handler);
        new proxy(); // tslint:disable-line:no-unused-expression
    }
    catch {
        return false;
    }
    return true;
};

/*
 * This massive regex tries to cover all the following cases.
 *
 * import './path';
 * import defaultImport from './path';
 * import { namedImport } from './path';
 * import { namedImport as renamendImport } from './path';
 * import * as namespaceImport from './path';
 * import defaultImport, { namedImport } from './path';
 * import defaultImport, { namedImport as renamendImport } from './path';
 * import defaultImport, * as namespaceImport from './path';
 */
const IMPORT_STATEMENT_REGEX = /^import(?:(?:[\s]+[\w]+|(?:[\s]+[\w]+[\s]*,)?[\s]*\{[\s]*[\w]+(?:[\s]+as[\s]+[\w]+)?(?:[\s]*,[\s]*[\w]+(?:[\s]+as[\s]+[\w]+)?)*[\s]*}|(?:[\s]+[\w]+[\s]*,)?[\s]*\*[\s]+as[\s]+[\w]+)[\s]+from)?(?:[\s]*)("([^"\\]|\\.)+"|'([^'\\]|\\.)+')(?:[\s]*);?/; // tslint:disable-line:max-line-length
const splitImportStatements = (source, url) => {
    const importStatements = [];
    let sourceWithoutImportStatements = source.replace(/^[\s]+/, '');
    let result = sourceWithoutImportStatements.match(IMPORT_STATEMENT_REGEX);
    while (result !== null) {
        const unresolvedUrl = result[1].slice(1, -1);
        const importStatementWithResolvedUrl = result[0]
            .replace(/([\s]+)?;?$/, '')
            .replace(unresolvedUrl, new URL(unresolvedUrl, url).toString());
        importStatements.push(importStatementWithResolvedUrl);
        sourceWithoutImportStatements = sourceWithoutImportStatements.slice(result[0].length).replace(/^[\s]+/, '');
        result = sourceWithoutImportStatements.match(IMPORT_STATEMENT_REGEX);
    }
    return [importStatements.join(';'), sourceWithoutImportStatements];
};

const verifyParameterDescriptors = (parameterDescriptors) => {
    if (parameterDescriptors !== undefined && !Array.isArray(parameterDescriptors)) {
        throw new TypeError('The parameterDescriptors property of given value for processorCtor is not an array.');
    }
};
const verifyProcessorCtor = (processorCtor) => {
    if (!isConstructible(processorCtor)) {
        throw new TypeError('The given value for processorCtor should be a constructor.');
    }
    if (processorCtor.prototype === null || typeof processorCtor.prototype !== 'object') {
        throw new TypeError('The given value for processorCtor should have a prototype.');
    }
};
const createAddAudioWorkletModule = (cacheTestResult, createNotSupportedError, evaluateSource, exposeCurrentFrameAndCurrentTime, fetchSource, getNativeContext, getOrCreateBackupOfflineAudioContext, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor, ongoingRequests, resolvedRequests, testAudioWorkletProcessorPostMessageSupport, window) => {
    let index = 0;
    return (context, moduleURL, options = { credentials: 'omit' }) => {
        const resolvedRequestsOfContext = resolvedRequests.get(context);
        if (resolvedRequestsOfContext !== undefined && resolvedRequestsOfContext.has(moduleURL)) {
            return Promise.resolve();
        }
        const ongoingRequestsOfContext = ongoingRequests.get(context);
        if (ongoingRequestsOfContext !== undefined) {
            const promiseOfOngoingRequest = ongoingRequestsOfContext.get(moduleURL);
            if (promiseOfOngoingRequest !== undefined) {
                return promiseOfOngoingRequest;
            }
        }
        const nativeContext = getNativeContext(context);
        // Bug #59: Safari does not implement the audioWorklet property.
        const promise = nativeContext.audioWorklet === undefined
            ? fetchSource(moduleURL)
                .then(([source, absoluteUrl]) => {
                const [importStatements, sourceWithoutImportStatements] = splitImportStatements(source, absoluteUrl);
                /*
                 * This is the unminified version of the code used below:
                 *
                 * ```js
                 * ${ importStatements };
                 * ((a, b) => {
                 *     (a[b] = a[b] || [ ]).push(
                 *         (AudioWorkletProcessor, global, registerProcessor, sampleRate, self, window) => {
                 *             ${ sourceWithoutImportStatements }
                 *         }
                 *     );
                 * })(window, '_AWGS');
                 * ```
                 */
                // tslint:disable-next-line:max-line-length
                const wrappedSource = `${importStatements};((a,b)=>{(a[b]=a[b]||[]).push((AudioWorkletProcessor,global,registerProcessor,sampleRate,self,window)=>{${sourceWithoutImportStatements}
})})(window,'_AWGS')`;
                // @todo Evaluating the given source code is a possible security problem.
                return evaluateSource(wrappedSource);
            })
                .then(() => {
                const evaluateAudioWorkletGlobalScope = window._AWGS.pop();
                if (evaluateAudioWorkletGlobalScope === undefined) {
                    // Bug #182 Chrome, Edge and Opera do throw an instance of a SyntaxError instead of a DOMException.
                    throw new SyntaxError();
                }
                exposeCurrentFrameAndCurrentTime(nativeContext.currentTime, nativeContext.sampleRate, () => evaluateAudioWorkletGlobalScope(class AudioWorkletProcessor {
                }, undefined, (name, processorCtor) => {
                    if (name.trim() === '') {
                        throw createNotSupportedError();
                    }
                    const nodeNameToProcessorConstructorMap = NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS.get(nativeContext);
                    if (nodeNameToProcessorConstructorMap !== undefined) {
                        if (nodeNameToProcessorConstructorMap.has(name)) {
                            throw createNotSupportedError();
                        }
                        verifyProcessorCtor(processorCtor);
                        verifyParameterDescriptors(processorCtor.parameterDescriptors);
                        nodeNameToProcessorConstructorMap.set(name, processorCtor);
                    }
                    else {
                        verifyProcessorCtor(processorCtor);
                        verifyParameterDescriptors(processorCtor.parameterDescriptors);
                        NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS.set(nativeContext, new Map([[name, processorCtor]]));
                    }
                }, nativeContext.sampleRate, undefined, undefined));
            })
            : Promise.all([
                fetchSource(moduleURL),
                Promise.resolve(cacheTestResult(testAudioWorkletProcessorPostMessageSupport, testAudioWorkletProcessorPostMessageSupport))
            ]).then(([[source, absoluteUrl], isSupportingPostMessage]) => {
                const currentIndex = index + 1;
                index = currentIndex;
                const [importStatements, sourceWithoutImportStatements] = splitImportStatements(source, absoluteUrl);
                /*
                 * Bug #179: Firefox does not allow to transfer any buffer which has been passed to the process() method as an argument.
                 *
                 * This is the unminified version of the code used below.
                 *
                 * ```js
                 * class extends AudioWorkletProcessor {
                 *
                 *     __buffers = new WeakSet();
                 *
                 *     constructor () {
                 *         super();
                 *
                 *         this.port.postMessage = ((postMessage) => {
                 *             return (message, transferables) => {
                 *                 const filteredTransferables = (transferables)
                 *                     ? transferables.filter((transferable) => !this.__buffers.has(transferable))
                 *                     : transferables;
                 *
                 *                 return postMessage.call(this.port, message, filteredTransferables);
                 *              };
                 *         })(this.port.postMessage);
                 *     }
                 * }
                 * ```
                 */
                const patchedAudioWorkletProcessor = isSupportingPostMessage
                    ? 'AudioWorkletProcessor'
                    : 'class extends AudioWorkletProcessor {__b=new WeakSet();constructor(){super();(p=>p.postMessage=(q=>(m,t)=>q.call(p,m,t?t.filter(u=>!this.__b.has(u)):t))(p.postMessage))(this.port)}}';
                /*
                 * Bug #170: Chrome and Edge do call process() with an array with empty channelData for each input if no input is connected.
                 *
                 * Bug #179: Firefox does not allow to transfer any buffer which has been passed to the process() method as an argument.
                 *
                 * Bug #190: Safari doesn't throw an error when loading an unparsable module.
                 *
                 * This is the unminified version of the code used below:
                 *
                 * ```js
                 * `${ importStatements };
                 * ((AudioWorkletProcessor, registerProcessor) => {${ sourceWithoutImportStatements }
                 * })(
                 *     ${ patchedAudioWorkletProcessor },
                 *     (name, processorCtor) => registerProcessor(name, class extends processorCtor {
                 *
                 *         __collectBuffers = (array) => {
                 *             array.forEach((element) => this.__buffers.add(element.buffer));
                 *         };
                 *
                 *         process (inputs, outputs, parameters) {
                 *             inputs.forEach(this.__collectBuffers);
                 *             outputs.forEach(this.__collectBuffers);
                 *             this.__collectBuffers(Object.values(parameters));
                 *
                 *             return super.process(
                 *                 (inputs.map((input) => input.some((channelData) => channelData.length === 0)) ? [ ] : input),
                 *                 outputs,
                 *                 parameters
                 *             );
                 *         }
                 *
                 *     })
                 * );
                 *
                 * registerProcessor(`__sac${currentIndex}`, class extends AudioWorkletProcessor{
                 *
                 *     process () {
                 *         return false;
                 *     }
                 *
                 * })`
                 * ```
                 */
                const memberDefinition = isSupportingPostMessage ? '' : '__c = (a) => a.forEach(e=>this.__b.add(e.buffer));';
                const bufferRegistration = isSupportingPostMessage
                    ? ''
                    : 'i.forEach(this.__c);o.forEach(this.__c);this.__c(Object.values(p));';
                const wrappedSource = `${importStatements};((AudioWorkletProcessor,registerProcessor)=>{${sourceWithoutImportStatements}
})(${patchedAudioWorkletProcessor},(n,p)=>registerProcessor(n,class extends p{${memberDefinition}process(i,o,p){${bufferRegistration}return super.process(i.map(j=>j.some(k=>k.length===0)?[]:j),o,p)}}));registerProcessor('__sac${currentIndex}',class extends AudioWorkletProcessor{process(){return !1}})`;
                const blob = new Blob([wrappedSource], { type: 'application/javascript; charset=utf-8' });
                const url = URL.createObjectURL(blob);
                return nativeContext.audioWorklet
                    .addModule(url, options)
                    .then(() => {
                    if (isNativeOfflineAudioContext(nativeContext)) {
                        return nativeContext;
                    }
                    // Bug #186: Chrome, Edge and Opera do not allow to create an AudioWorkletNode on a closed AudioContext.
                    const backupOfflineAudioContext = getOrCreateBackupOfflineAudioContext(nativeContext);
                    return backupOfflineAudioContext.audioWorklet.addModule(url, options).then(() => backupOfflineAudioContext);
                })
                    .then((nativeContextOrBackupOfflineAudioContext) => {
                    if (nativeAudioWorkletNodeConstructor === null) {
                        throw new SyntaxError();
                    }
                    try {
                        // Bug #190: Safari doesn't throw an error when loading an unparsable module.
                        new nativeAudioWorkletNodeConstructor(nativeContextOrBackupOfflineAudioContext, `__sac${currentIndex}`); // tslint:disable-line:no-unused-expression
                    }
                    catch {
                        throw new SyntaxError();
                    }
                })
                    .finally(() => URL.revokeObjectURL(url));
            });
        if (ongoingRequestsOfContext === undefined) {
            ongoingRequests.set(context, new Map([[moduleURL, promise]]));
        }
        else {
            ongoingRequestsOfContext.set(moduleURL, promise);
        }
        promise
            .then(() => {
            const updatedResolvedRequestsOfContext = resolvedRequests.get(context);
            if (updatedResolvedRequestsOfContext === undefined) {
                resolvedRequests.set(context, new Set([moduleURL]));
            }
            else {
                updatedResolvedRequestsOfContext.add(moduleURL);
            }
        })
            .finally(() => {
            const updatedOngoingRequestsOfContext = ongoingRequests.get(context);
            if (updatedOngoingRequestsOfContext !== undefined) {
                updatedOngoingRequestsOfContext.delete(moduleURL);
            }
        });
        return promise;
    };
};

const getValueForKey = (map, key) => {
    const value = map.get(key);
    if (value === undefined) {
        throw new Error('A value with the given key could not be found.');
    }
    return value;
};

const pickElementFromSet = (set, predicate) => {
    const matchingElements = Array.from(set).filter(predicate);
    if (matchingElements.length > 1) {
        throw Error('More than one element was found.');
    }
    if (matchingElements.length === 0) {
        throw Error('No element was found.');
    }
    const [matchingElement] = matchingElements;
    set.delete(matchingElement);
    return matchingElement;
};

const deletePassiveInputConnectionToAudioNode = (passiveInputs, source, output, input) => {
    const passiveInputConnections = getValueForKey(passiveInputs, source);
    const matchingConnection = pickElementFromSet(passiveInputConnections, (passiveInputConnection) => passiveInputConnection[0] === output && passiveInputConnection[1] === input);
    if (passiveInputConnections.size === 0) {
        passiveInputs.delete(source);
    }
    return matchingConnection;
};

const getEventListenersOfAudioNode = (audioNode) => {
    return getValueForKey(EVENT_LISTENERS, audioNode);
};

const setInternalStateToActive = (audioNode) => {
    if (ACTIVE_AUDIO_NODE_STORE.has(audioNode)) {
        throw new Error('The AudioNode is already stored.');
    }
    ACTIVE_AUDIO_NODE_STORE.add(audioNode);
    getEventListenersOfAudioNode(audioNode).forEach((eventListener) => eventListener(true));
};

const isAudioWorkletNode = (audioNode) => {
    return 'port' in audioNode;
};

const setInternalStateToPassive = (audioNode) => {
    if (!ACTIVE_AUDIO_NODE_STORE.has(audioNode)) {
        throw new Error('The AudioNode is not stored.');
    }
    ACTIVE_AUDIO_NODE_STORE.delete(audioNode);
    getEventListenersOfAudioNode(audioNode).forEach((eventListener) => eventListener(false));
};

// Set the internalState of the audioNode to 'passive' if it is not an AudioWorkletNode and if it has no 'active' input connections.
const setInternalStateToPassiveWhenNecessary = (audioNode, activeInputs) => {
    if (!isAudioWorkletNode(audioNode) && activeInputs.every((connections) => connections.size === 0)) {
        setInternalStateToPassive(audioNode);
    }
};

const createAddConnectionToAudioNode = (addActiveInputConnectionToAudioNode, addPassiveInputConnectionToAudioNode, connectNativeAudioNodeToNativeAudioNode, deleteActiveInputConnectionToAudioNode, disconnectNativeAudioNodeFromNativeAudioNode, getAudioNodeConnections, getAudioNodeTailTime, getEventListenersOfAudioNode, getNativeAudioNode, insertElementInSet, isActiveAudioNode, isPartOfACycle, isPassiveAudioNode) => {
    const tailTimeTimeoutIds = new WeakMap();
    return (source, destination, output, input, isOffline) => {
        const { activeInputs, passiveInputs } = getAudioNodeConnections(destination);
        const { outputs } = getAudioNodeConnections(source);
        const eventListeners = getEventListenersOfAudioNode(source);
        const eventListener = (isActive) => {
            const nativeDestinationAudioNode = getNativeAudioNode(destination);
            const nativeSourceAudioNode = getNativeAudioNode(source);
            if (isActive) {
                const partialConnection = deletePassiveInputConnectionToAudioNode(passiveInputs, source, output, input);
                addActiveInputConnectionToAudioNode(activeInputs, source, partialConnection, false);
                if (!isOffline && !isPartOfACycle(source)) {
                    connectNativeAudioNodeToNativeAudioNode(nativeSourceAudioNode, nativeDestinationAudioNode, output, input);
                }
                if (isPassiveAudioNode(destination)) {
                    setInternalStateToActive(destination);
                }
            }
            else {
                const partialConnection = deleteActiveInputConnectionToAudioNode(activeInputs, source, output, input);
                addPassiveInputConnectionToAudioNode(passiveInputs, input, partialConnection, false);
                if (!isOffline && !isPartOfACycle(source)) {
                    disconnectNativeAudioNodeFromNativeAudioNode(nativeSourceAudioNode, nativeDestinationAudioNode, output, input);
                }
                const tailTime = getAudioNodeTailTime(destination);
                if (tailTime === 0) {
                    if (isActiveAudioNode(destination)) {
                        setInternalStateToPassiveWhenNecessary(destination, activeInputs);
                    }
                }
                else {
                    const tailTimeTimeoutId = tailTimeTimeoutIds.get(destination);
                    if (tailTimeTimeoutId !== undefined) {
                        clearTimeout(tailTimeTimeoutId);
                    }
                    tailTimeTimeoutIds.set(destination, setTimeout(() => {
                        if (isActiveAudioNode(destination)) {
                            setInternalStateToPassiveWhenNecessary(destination, activeInputs);
                        }
                    }, tailTime * 1000));
                }
            }
        };
        if (insertElementInSet(outputs, [destination, output, input], (outputConnection) => outputConnection[0] === destination && outputConnection[1] === output && outputConnection[2] === input, true)) {
            eventListeners.add(eventListener);
            if (isActiveAudioNode(source)) {
                addActiveInputConnectionToAudioNode(activeInputs, source, [output, input, eventListener], true);
            }
            else {
                addPassiveInputConnectionToAudioNode(passiveInputs, input, [source, output, eventListener], true);
            }
            return true;
        }
        return false;
    };
};

const createAddPassiveInputConnectionToAudioNode = (insertElementInSet) => {
    return (passiveInputs, input, [source, output, eventListener], ignoreDuplicates) => {
        const passiveInputConnections = passiveInputs.get(source);
        if (passiveInputConnections === undefined) {
            passiveInputs.set(source, new Set([[output, input, eventListener]]));
        }
        else {
            insertElementInSet(passiveInputConnections, [output, input, eventListener], (passiveInputConnection) => passiveInputConnection[0] === output && passiveInputConnection[1] === input, ignoreDuplicates);
        }
    };
};

const createAddSilentConnection = (createNativeGainNode) => {
    return (nativeContext, nativeAudioScheduledSourceNode) => {
        const nativeGainNode = createNativeGainNode(nativeContext, {
            channelCount: 1,
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete',
            gain: 0
        });
        nativeAudioScheduledSourceNode.connect(nativeGainNode).connect(nativeContext.destination);
        const disconnect = () => {
            nativeAudioScheduledSourceNode.removeEventListener('ended', disconnect);
            nativeAudioScheduledSourceNode.disconnect(nativeGainNode);
            nativeGainNode.disconnect();
        };
        nativeAudioScheduledSourceNode.addEventListener('ended', disconnect);
    };
};

const createAddUnrenderedAudioWorkletNode = (getUnrenderedAudioWorkletNodes) => {
    return (nativeContext, audioWorkletNode) => {
        getUnrenderedAudioWorkletNodes(nativeContext).add(audioWorkletNode);
    };
};

const DEFAULT_OPTIONS = {
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    fftSize: 2048,
    maxDecibels: -30,
    minDecibels: -100,
    smoothingTimeConstant: 0.8
};
const createAnalyserNodeConstructor = (audionNodeConstructor, createAnalyserNodeRenderer, createIndexSizeError, createNativeAnalyserNode, getNativeContext, isNativeOfflineAudioContext) => {
    return class AnalyserNode extends audionNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
            const nativeAnalyserNode = createNativeAnalyserNode(nativeContext, mergedOptions);
            const analyserNodeRenderer = ((isNativeOfflineAudioContext(nativeContext) ? createAnalyserNodeRenderer() : null));
            super(context, false, nativeAnalyserNode, analyserNodeRenderer);
            this._nativeAnalyserNode = nativeAnalyserNode;
        }
        get fftSize() {
            return this._nativeAnalyserNode.fftSize;
        }
        set fftSize(value) {
            this._nativeAnalyserNode.fftSize = value;
        }
        get frequencyBinCount() {
            return this._nativeAnalyserNode.frequencyBinCount;
        }
        get maxDecibels() {
            return this._nativeAnalyserNode.maxDecibels;
        }
        set maxDecibels(value) {
            // Bug #118: Safari does not throw an error if maxDecibels is not more than minDecibels.
            const maxDecibels = this._nativeAnalyserNode.maxDecibels;
            this._nativeAnalyserNode.maxDecibels = value;
            if (!(value > this._nativeAnalyserNode.minDecibels)) {
                this._nativeAnalyserNode.maxDecibels = maxDecibels;
                throw createIndexSizeError();
            }
        }
        get minDecibels() {
            return this._nativeAnalyserNode.minDecibels;
        }
        set minDecibels(value) {
            // Bug #118: Safari does not throw an error if maxDecibels is not more than minDecibels.
            const minDecibels = this._nativeAnalyserNode.minDecibels;
            this._nativeAnalyserNode.minDecibels = value;
            if (!(this._nativeAnalyserNode.maxDecibels > value)) {
                this._nativeAnalyserNode.minDecibels = minDecibels;
                throw createIndexSizeError();
            }
        }
        get smoothingTimeConstant() {
            return this._nativeAnalyserNode.smoothingTimeConstant;
        }
        set smoothingTimeConstant(value) {
            this._nativeAnalyserNode.smoothingTimeConstant = value;
        }
        getByteFrequencyData(array) {
            this._nativeAnalyserNode.getByteFrequencyData(array);
        }
        getByteTimeDomainData(array) {
            this._nativeAnalyserNode.getByteTimeDomainData(array);
        }
        getFloatFrequencyData(array) {
            this._nativeAnalyserNode.getFloatFrequencyData(array);
        }
        getFloatTimeDomainData(array) {
            this._nativeAnalyserNode.getFloatTimeDomainData(array);
        }
    };
};

const isOwnedByContext = (nativeAudioNode, nativeContext) => {
    return nativeAudioNode.context === nativeContext;
};

const createAnalyserNodeRendererFactory = (createNativeAnalyserNode, getNativeAudioNode, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeAnalyserNodes = new WeakMap();
        const createAnalyserNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeAnalyserNode = getNativeAudioNode(proxy);
            // If the initially used nativeAnalyserNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativeAnalyserNodeIsOwnedByContext = isOwnedByContext(nativeAnalyserNode, nativeOfflineAudioContext);
            if (!nativeAnalyserNodeIsOwnedByContext) {
                const options = {
                    channelCount: nativeAnalyserNode.channelCount,
                    channelCountMode: nativeAnalyserNode.channelCountMode,
                    channelInterpretation: nativeAnalyserNode.channelInterpretation,
                    fftSize: nativeAnalyserNode.fftSize,
                    maxDecibels: nativeAnalyserNode.maxDecibels,
                    minDecibels: nativeAnalyserNode.minDecibels,
                    smoothingTimeConstant: nativeAnalyserNode.smoothingTimeConstant
                };
                nativeAnalyserNode = createNativeAnalyserNode(nativeOfflineAudioContext, options);
            }
            renderedNativeAnalyserNodes.set(nativeOfflineAudioContext, nativeAnalyserNode);
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAnalyserNode);
            return nativeAnalyserNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeAnalyserNode = renderedNativeAnalyserNodes.get(nativeOfflineAudioContext);
                if (renderedNativeAnalyserNode !== undefined) {
                    return Promise.resolve(renderedNativeAnalyserNode);
                }
                return createAnalyserNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const testAudioBufferCopyChannelMethodsOutOfBoundsSupport = (nativeAudioBuffer) => {
    try {
        nativeAudioBuffer.copyToChannel(new Float32Array(1), 0, -1);
    }
    catch {
        return false;
    }
    return true;
};

const createIndexSizeError = () => new DOMException('', 'IndexSizeError');

const wrapAudioBufferGetChannelDataMethod = (audioBuffer) => {
    audioBuffer.getChannelData = ((getChannelData) => {
        return (channel) => {
            try {
                return getChannelData.call(audioBuffer, channel);
            }
            catch (err) {
                if (err.code === 12) {
                    throw createIndexSizeError();
                }
                throw err;
            }
        };
    })(audioBuffer.getChannelData);
};

const DEFAULT_OPTIONS$1 = {
    numberOfChannels: 1
};
const createAudioBufferConstructor = (audioBufferStore, cacheTestResult, createNotSupportedError, nativeAudioBufferConstructor, nativeOfflineAudioContextConstructor, testNativeAudioBufferConstructorSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds) => {
    let nativeOfflineAudioContext = null;
    return class AudioBuffer {
        constructor(options) {
            if (nativeOfflineAudioContextConstructor === null) {
                throw new Error('Missing the native OfflineAudioContext constructor.');
            }
            const { length, numberOfChannels, sampleRate } = { ...DEFAULT_OPTIONS$1, ...options };
            if (nativeOfflineAudioContext === null) {
                nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
            }
            /*
             * Bug #99: Firefox does not throw a NotSupportedError when the numberOfChannels is zero. But it only does it when using the
             * factory function. But since Firefox also supports the constructor everything should be fine.
             */
            const audioBuffer = nativeAudioBufferConstructor !== null &&
                cacheTestResult(testNativeAudioBufferConstructorSupport, testNativeAudioBufferConstructorSupport)
                ? new nativeAudioBufferConstructor({ length, numberOfChannels, sampleRate })
                : nativeOfflineAudioContext.createBuffer(numberOfChannels, length, sampleRate);
            // Bug #99: Safari does not throw an error when the numberOfChannels is zero.
            if (audioBuffer.numberOfChannels === 0) {
                throw createNotSupportedError();
            }
            // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
            // Bug #100: Safari does throw a wrong error when calling getChannelData() with an out-of-bounds value.
            if (typeof audioBuffer.copyFromChannel !== 'function') {
                wrapAudioBufferCopyChannelMethods(audioBuffer);
                wrapAudioBufferGetChannelDataMethod(audioBuffer);
                // Bug #157: Firefox does not allow the bufferOffset to be out-of-bounds.
            }
            else if (!cacheTestResult(testAudioBufferCopyChannelMethodsOutOfBoundsSupport, () => testAudioBufferCopyChannelMethodsOutOfBoundsSupport(audioBuffer))) {
                wrapAudioBufferCopyChannelMethodsOutOfBounds(audioBuffer);
            }
            audioBufferStore.add(audioBuffer);
            /*
             * This does violate all good pratices but it is necessary to allow this AudioBuffer to be used with native
             * (Offline)AudioContexts.
             */
            return audioBuffer;
        }
        static [Symbol.hasInstance](instance) {
            return ((instance !== null && typeof instance === 'object' && Object.getPrototypeOf(instance) === AudioBuffer.prototype) ||
                audioBufferStore.has(instance));
        }
    };
};

const MOST_NEGATIVE_SINGLE_FLOAT = -3.4028234663852886e38;
const MOST_POSITIVE_SINGLE_FLOAT = -MOST_NEGATIVE_SINGLE_FLOAT;

const isActiveAudioNode = (audioNode) => ACTIVE_AUDIO_NODE_STORE.has(audioNode);

const DEFAULT_OPTIONS$2 = {
    buffer: null,
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    // Bug #149: Safari does not yet support the detune AudioParam.
    loop: false,
    loopEnd: 0,
    loopStart: 0,
    playbackRate: 1
};
const createAudioBufferSourceNodeConstructor = (audioNodeConstructor, createAudioBufferSourceNodeRenderer, createAudioParam, createInvalidStateError, createNativeAudioBufferSourceNode, getNativeContext, isNativeOfflineAudioContext, wrapEventListener) => {
    return class AudioBufferSourceNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$2, ...options };
            const nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const audioBufferSourceNodeRenderer = ((isOffline ? createAudioBufferSourceNodeRenderer() : null));
            super(context, false, nativeAudioBufferSourceNode, audioBufferSourceNodeRenderer);
            this._audioBufferSourceNodeRenderer = audioBufferSourceNodeRenderer;
            this._isBufferNullified = false;
            this._isBufferSet = mergedOptions.buffer !== null;
            this._nativeAudioBufferSourceNode = nativeAudioBufferSourceNode;
            this._onended = null;
            // Bug #73: Safari does not export the correct values for maxValue and minValue.
            this._playbackRate = createAudioParam(this, isOffline, nativeAudioBufferSourceNode.playbackRate, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
        }
        get buffer() {
            if (this._isBufferNullified) {
                return null;
            }
            return this._nativeAudioBufferSourceNode.buffer;
        }
        set buffer(value) {
            this._nativeAudioBufferSourceNode.buffer = value;
            // Bug #72: Only Chrome, Edge & Opera do not allow to reassign the buffer yet.
            if (value !== null) {
                if (this._isBufferSet) {
                    throw createInvalidStateError();
                }
                this._isBufferSet = true;
            }
        }
        get loop() {
            return this._nativeAudioBufferSourceNode.loop;
        }
        set loop(value) {
            this._nativeAudioBufferSourceNode.loop = value;
        }
        get loopEnd() {
            return this._nativeAudioBufferSourceNode.loopEnd;
        }
        set loopEnd(value) {
            this._nativeAudioBufferSourceNode.loopEnd = value;
        }
        get loopStart() {
            return this._nativeAudioBufferSourceNode.loopStart;
        }
        set loopStart(value) {
            this._nativeAudioBufferSourceNode.loopStart = value;
        }
        get onended() {
            return this._onended;
        }
        set onended(value) {
            const wrappedListener = typeof value === 'function' ? wrapEventListener(this, value) : null;
            this._nativeAudioBufferSourceNode.onended = wrappedListener;
            const nativeOnEnded = this._nativeAudioBufferSourceNode.onended;
            this._onended = nativeOnEnded !== null && nativeOnEnded === wrappedListener ? value : nativeOnEnded;
        }
        get playbackRate() {
            return this._playbackRate;
        }
        start(when = 0, offset = 0, duration) {
            this._nativeAudioBufferSourceNode.start(when, offset, duration);
            if (this._audioBufferSourceNodeRenderer !== null) {
                this._audioBufferSourceNodeRenderer.start = duration === undefined ? [when, offset] : [when, offset, duration];
            }
            if (this.context.state !== 'closed') {
                setInternalStateToActive(this);
                const resetInternalStateToPassive = () => {
                    this._nativeAudioBufferSourceNode.removeEventListener('ended', resetInternalStateToPassive);
                    if (isActiveAudioNode(this)) {
                        setInternalStateToPassive(this);
                    }
                };
                this._nativeAudioBufferSourceNode.addEventListener('ended', resetInternalStateToPassive);
            }
        }
        stop(when = 0) {
            this._nativeAudioBufferSourceNode.stop(when);
            if (this._audioBufferSourceNodeRenderer !== null) {
                this._audioBufferSourceNodeRenderer.stop = when;
            }
        }
    };
};

const createAudioBufferSourceNodeRendererFactory = (connectAudioParam, createNativeAudioBufferSourceNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeAudioBufferSourceNodes = new WeakMap();
        let start = null;
        let stop = null;
        const createAudioBufferSourceNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeAudioBufferSourceNode = getNativeAudioNode(proxy);
            /*
             * If the initially used nativeAudioBufferSourceNode was not constructed on the same OfflineAudioContext it needs to be created
             * again.
             */
            const nativeAudioBufferSourceNodeIsOwnedByContext = isOwnedByContext(nativeAudioBufferSourceNode, nativeOfflineAudioContext);
            if (!nativeAudioBufferSourceNodeIsOwnedByContext) {
                const options = {
                    buffer: nativeAudioBufferSourceNode.buffer,
                    channelCount: nativeAudioBufferSourceNode.channelCount,
                    channelCountMode: nativeAudioBufferSourceNode.channelCountMode,
                    channelInterpretation: nativeAudioBufferSourceNode.channelInterpretation,
                    // Bug #149: Safari does not yet support the detune AudioParam.
                    loop: nativeAudioBufferSourceNode.loop,
                    loopEnd: nativeAudioBufferSourceNode.loopEnd,
                    loopStart: nativeAudioBufferSourceNode.loopStart,
                    playbackRate: nativeAudioBufferSourceNode.playbackRate.value
                };
                nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode(nativeOfflineAudioContext, options);
                if (start !== null) {
                    nativeAudioBufferSourceNode.start(...start);
                }
                if (stop !== null) {
                    nativeAudioBufferSourceNode.stop(stop);
                }
            }
            renderedNativeAudioBufferSourceNodes.set(nativeOfflineAudioContext, nativeAudioBufferSourceNode);
            if (!nativeAudioBufferSourceNodeIsOwnedByContext) {
                // Bug #149: Safari does not yet support the detune AudioParam.
                await renderAutomation(nativeOfflineAudioContext, proxy.playbackRate, nativeAudioBufferSourceNode.playbackRate);
            }
            else {
                // Bug #149: Safari does not yet support the detune AudioParam.
                await connectAudioParam(nativeOfflineAudioContext, proxy.playbackRate, nativeAudioBufferSourceNode.playbackRate);
            }
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioBufferSourceNode);
            return nativeAudioBufferSourceNode;
        };
        return {
            set start(value) {
                start = value;
            },
            set stop(value) {
                stop = value;
            },
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeAudioBufferSourceNode = renderedNativeAudioBufferSourceNodes.get(nativeOfflineAudioContext);
                if (renderedNativeAudioBufferSourceNode !== undefined) {
                    return Promise.resolve(renderedNativeAudioBufferSourceNode);
                }
                return createAudioBufferSourceNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const isAudioBufferSourceNode = (audioNode) => {
    return 'playbackRate' in audioNode;
};

const isBiquadFilterNode = (audioNode) => {
    return 'frequency' in audioNode && 'gain' in audioNode;
};

const isConstantSourceNode = (audioNode) => {
    return 'offset' in audioNode;
};

const isGainNode = (audioNode) => {
    return !('frequency' in audioNode) && 'gain' in audioNode;
};

const isOscillatorNode = (audioNode) => {
    return 'detune' in audioNode && 'frequency' in audioNode;
};

const isStereoPannerNode = (audioNode) => {
    return 'pan' in audioNode;
};

const getAudioNodeConnections = (audioNode) => {
    return getValueForKey(AUDIO_NODE_CONNECTIONS_STORE, audioNode);
};

const getAudioParamConnections = (audioParam) => {
    return getValueForKey(AUDIO_PARAM_CONNECTIONS_STORE, audioParam);
};

const deactivateActiveAudioNodeInputConnections = (audioNode, trace) => {
    const { activeInputs } = getAudioNodeConnections(audioNode);
    activeInputs.forEach((connections) => connections.forEach(([source]) => {
        if (!trace.includes(audioNode)) {
            deactivateActiveAudioNodeInputConnections(source, [...trace, audioNode]);
        }
    }));
    const audioParams = isAudioBufferSourceNode(audioNode)
        ? [
            // Bug #149: Safari does not yet support the detune AudioParam.
            audioNode.playbackRate
        ]
        : isAudioWorkletNode(audioNode)
            ? Array.from(audioNode.parameters.values())
            : isBiquadFilterNode(audioNode)
                ? [audioNode.Q, audioNode.detune, audioNode.frequency, audioNode.gain]
                : isConstantSourceNode(audioNode)
                    ? [audioNode.offset]
                    : isGainNode(audioNode)
                        ? [audioNode.gain]
                        : isOscillatorNode(audioNode)
                            ? [audioNode.detune, audioNode.frequency]
                            : isStereoPannerNode(audioNode)
                                ? [audioNode.pan]
                                : [];
    for (const audioParam of audioParams) {
        const audioParamConnections = getAudioParamConnections(audioParam);
        if (audioParamConnections !== undefined) {
            audioParamConnections.activeInputs.forEach(([source]) => deactivateActiveAudioNodeInputConnections(source, trace));
        }
    }
    if (isActiveAudioNode(audioNode)) {
        setInternalStateToPassive(audioNode);
    }
};

const deactivateAudioGraph = (context) => {
    deactivateActiveAudioNodeInputConnections(context.destination, []);
};

const isValidLatencyHint = (latencyHint) => {
    return (latencyHint === undefined ||
        typeof latencyHint === 'number' ||
        (typeof latencyHint === 'string' && (latencyHint === 'balanced' || latencyHint === 'interactive' || latencyHint === 'playback')));
};

const createAudioContextConstructor = (baseAudioContextConstructor, createInvalidStateError, createNotSupportedError, createUnknownError, mediaElementAudioSourceNodeConstructor, mediaStreamAudioDestinationNodeConstructor, mediaStreamAudioSourceNodeConstructor, mediaStreamTrackAudioSourceNodeConstructor, nativeAudioContextConstructor) => {
    return class AudioContext extends baseAudioContextConstructor {
        constructor(options = {}) {
            if (nativeAudioContextConstructor === null) {
                throw new Error('Missing the native AudioContext constructor.');
            }
            let nativeAudioContext;
            try {
                nativeAudioContext = new nativeAudioContextConstructor(options);
            }
            catch (err) {
                // Bug #192 Safari does throw a SyntaxError if the sampleRate is not supported.
                if (err.code === 12 && err.message === 'sampleRate is not in range') {
                    throw createNotSupportedError();
                }
                throw err;
            }
            // Bug #131 Safari returns null when there are four other AudioContexts running already.
            if (nativeAudioContext === null) {
                throw createUnknownError();
            }
            // Bug #51 Only Chrome, Edge and Opera throw an error if the given latencyHint is invalid.
            if (!isValidLatencyHint(options.latencyHint)) {
                throw new TypeError(`The provided value '${options.latencyHint}' is not a valid enum value of type AudioContextLatencyCategory.`);
            }
            // Bug #150 Safari does not support setting the sampleRate.
            if (options.sampleRate !== undefined && nativeAudioContext.sampleRate !== options.sampleRate) {
                throw createNotSupportedError();
            }
            super(nativeAudioContext, 2);
            const { latencyHint } = options;
            const { sampleRate } = nativeAudioContext;
            // @todo The values for 'balanced', 'interactive' and 'playback' are just copied from Chrome's implementation.
            this._baseLatency =
                typeof nativeAudioContext.baseLatency === 'number'
                    ? nativeAudioContext.baseLatency
                    : latencyHint === 'balanced'
                        ? 512 / sampleRate
                        : latencyHint === 'interactive' || latencyHint === undefined
                            ? 256 / sampleRate
                            : latencyHint === 'playback'
                                ? 1024 / sampleRate
                                : /*
                                   * @todo The min (256) and max (16384) values are taken from the allowed bufferSize values of a
                                   * ScriptProcessorNode.
                                   */
                                    (Math.max(2, Math.min(128, Math.round((latencyHint * sampleRate) / 128))) * 128) / sampleRate;
            this._nativeAudioContext = nativeAudioContext;
            // Bug #188: Safari will set the context's state to 'interrupted' in case the user switches tabs.
            if (nativeAudioContextConstructor.name === 'webkitAudioContext') {
                this._nativeGainNode = nativeAudioContext.createGain();
                this._nativeOscillatorNode = nativeAudioContext.createOscillator();
                this._nativeGainNode.gain.value = 1e-37;
                this._nativeOscillatorNode.connect(this._nativeGainNode).connect(nativeAudioContext.destination);
                this._nativeOscillatorNode.start();
            }
            else {
                this._nativeGainNode = null;
                this._nativeOscillatorNode = null;
            }
            this._state = null;
            /*
             * Bug #34: Chrome, Edge and Opera pretend to be running right away, but fire an onstatechange event when the state actually
             * changes to 'running'.
             */
            if (nativeAudioContext.state === 'running') {
                this._state = 'suspended';
                const revokeState = () => {
                    if (this._state === 'suspended') {
                        this._state = null;
                    }
                    nativeAudioContext.removeEventListener('statechange', revokeState);
                };
                nativeAudioContext.addEventListener('statechange', revokeState);
            }
        }
        get baseLatency() {
            return this._baseLatency;
        }
        get state() {
            return this._state !== null ? this._state : this._nativeAudioContext.state;
        }
        close() {
            // Bug #35: Firefox does not throw an error if the AudioContext was closed before.
            if (this.state === 'closed') {
                return this._nativeAudioContext.close().then(() => {
                    throw createInvalidStateError();
                });
            }
            // Bug #34: If the state was set to suspended before it should be revoked now.
            if (this._state === 'suspended') {
                this._state = null;
            }
            return this._nativeAudioContext.close().then(() => {
                if (this._nativeGainNode !== null && this._nativeOscillatorNode !== null) {
                    this._nativeOscillatorNode.stop();
                    this._nativeGainNode.disconnect();
                    this._nativeOscillatorNode.disconnect();
                }
                deactivateAudioGraph(this);
            });
        }
        createMediaElementSource(mediaElement) {
            return new mediaElementAudioSourceNodeConstructor(this, { mediaElement });
        }
        createMediaStreamDestination() {
            return new mediaStreamAudioDestinationNodeConstructor(this);
        }
        createMediaStreamSource(mediaStream) {
            return new mediaStreamAudioSourceNodeConstructor(this, { mediaStream });
        }
        createMediaStreamTrackSource(mediaStreamTrack) {
            return new mediaStreamTrackAudioSourceNodeConstructor(this, { mediaStreamTrack });
        }
        resume() {
            if (this._state === 'suspended') {
                return new Promise((resolve, reject) => {
                    const resolvePromise = () => {
                        this._nativeAudioContext.removeEventListener('statechange', resolvePromise);
                        if (this._nativeAudioContext.state === 'running') {
                            resolve();
                        }
                        else {
                            this.resume().then(resolve, reject);
                        }
                    };
                    this._nativeAudioContext.addEventListener('statechange', resolvePromise);
                });
            }
            return this._nativeAudioContext.resume().catch((err) => {
                // Bug #55: Chrome, Edge and Opera do throw an InvalidAccessError instead of an InvalidStateError.
                // Bug #56: Safari invokes the catch handler but without an error.
                if (err === undefined || err.code === 15) {
                    throw createInvalidStateError();
                }
                throw err;
            });
        }
        suspend() {
            return this._nativeAudioContext.suspend().catch((err) => {
                // Bug #56: Safari invokes the catch handler but without an error.
                if (err === undefined) {
                    throw createInvalidStateError();
                }
                throw err;
            });
        }
    };
};

const createAudioDestinationNodeConstructor = (audioNodeConstructor, createAudioDestinationNodeRenderer, createIndexSizeError, createInvalidStateError, createNativeAudioDestinationNode, getNativeContext, isNativeOfflineAudioContext, renderInputsOfAudioNode) => {
    return class AudioDestinationNode extends audioNodeConstructor {
        constructor(context, channelCount) {
            const nativeContext = getNativeContext(context);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const nativeAudioDestinationNode = createNativeAudioDestinationNode(nativeContext, channelCount, isOffline);
            const audioDestinationNodeRenderer = ((isOffline ? createAudioDestinationNodeRenderer(renderInputsOfAudioNode) : null));
            super(context, false, nativeAudioDestinationNode, audioDestinationNodeRenderer);
            this._isNodeOfNativeOfflineAudioContext = isOffline;
            this._nativeAudioDestinationNode = nativeAudioDestinationNode;
        }
        get channelCount() {
            return this._nativeAudioDestinationNode.channelCount;
        }
        set channelCount(value) {
            // Bug #52: Chrome, Edge, Opera & Safari do not throw an exception at all.
            // Bug #54: Firefox does throw an IndexSizeError.
            if (this._isNodeOfNativeOfflineAudioContext) {
                throw createInvalidStateError();
            }
            // Bug #47: The AudioDestinationNode in Safari does not initialize the maxChannelCount property correctly.
            if (value > this._nativeAudioDestinationNode.maxChannelCount) {
                throw createIndexSizeError();
            }
            this._nativeAudioDestinationNode.channelCount = value;
        }
        get channelCountMode() {
            return this._nativeAudioDestinationNode.channelCountMode;
        }
        set channelCountMode(value) {
            // Bug #53: No browser does throw an exception yet.
            if (this._isNodeOfNativeOfflineAudioContext) {
                throw createInvalidStateError();
            }
            this._nativeAudioDestinationNode.channelCountMode = value;
        }
        get maxChannelCount() {
            return this._nativeAudioDestinationNode.maxChannelCount;
        }
    };
};

const createAudioDestinationNodeRenderer = (renderInputsOfAudioNode) => {
    const renderedNativeAudioDestinationNodes = new WeakMap();
    const createAudioDestinationNode = async (proxy, nativeOfflineAudioContext) => {
        const nativeAudioDestinationNode = nativeOfflineAudioContext.destination;
        renderedNativeAudioDestinationNodes.set(nativeOfflineAudioContext, nativeAudioDestinationNode);
        await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioDestinationNode);
        return nativeAudioDestinationNode;
    };
    return {
        render(proxy, nativeOfflineAudioContext) {
            const renderedNativeAudioDestinationNode = renderedNativeAudioDestinationNodes.get(nativeOfflineAudioContext);
            if (renderedNativeAudioDestinationNode !== undefined) {
                return Promise.resolve(renderedNativeAudioDestinationNode);
            }
            return createAudioDestinationNode(proxy, nativeOfflineAudioContext);
        }
    };
};

const createAudioListenerFactory = (createAudioParam, createNativeChannelMergerNode, createNativeConstantSourceNode, createNativeScriptProcessorNode, createNotSupportedError, getFirstSample, isNativeOfflineAudioContext, overwriteAccessors) => {
    return (context, nativeContext) => {
        const nativeListener = nativeContext.listener;
        // Bug #117: Only Chrome, Edge & Opera support the new interface already.
        const createFakeAudioParams = () => {
            const buffer = new Float32Array(1);
            const channelMergerNode = createNativeChannelMergerNode(nativeContext, {
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'speakers',
                numberOfInputs: 9
            });
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            let isScriptProcessorNodeCreated = false;
            let lastOrientation = [0, 0, -1, 0, 1, 0];
            let lastPosition = [0, 0, 0];
            const createScriptProcessorNode = () => {
                if (isScriptProcessorNodeCreated) {
                    return;
                }
                isScriptProcessorNodeCreated = true;
                const scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, 256, 9, 0);
                // tslint:disable-next-line:deprecation
                scriptProcessorNode.onaudioprocess = ({ inputBuffer }) => {
                    const orientation = [
                        getFirstSample(inputBuffer, buffer, 0),
                        getFirstSample(inputBuffer, buffer, 1),
                        getFirstSample(inputBuffer, buffer, 2),
                        getFirstSample(inputBuffer, buffer, 3),
                        getFirstSample(inputBuffer, buffer, 4),
                        getFirstSample(inputBuffer, buffer, 5)
                    ];
                    if (orientation.some((value, index) => value !== lastOrientation[index])) {
                        nativeListener.setOrientation(...orientation); // tslint:disable-line:deprecation
                        lastOrientation = orientation;
                    }
                    const positon = [
                        getFirstSample(inputBuffer, buffer, 6),
                        getFirstSample(inputBuffer, buffer, 7),
                        getFirstSample(inputBuffer, buffer, 8)
                    ];
                    if (positon.some((value, index) => value !== lastPosition[index])) {
                        nativeListener.setPosition(...positon); // tslint:disable-line:deprecation
                        lastPosition = positon;
                    }
                };
                channelMergerNode.connect(scriptProcessorNode);
            };
            const createSetOrientation = (index) => (value) => {
                if (value !== lastOrientation[index]) {
                    lastOrientation[index] = value;
                    nativeListener.setOrientation(...lastOrientation); // tslint:disable-line:deprecation
                }
            };
            const createSetPosition = (index) => (value) => {
                if (value !== lastPosition[index]) {
                    lastPosition[index] = value;
                    nativeListener.setPosition(...lastPosition); // tslint:disable-line:deprecation
                }
            };
            const createFakeAudioParam = (input, initialValue, setValue) => {
                const constantSourceNode = createNativeConstantSourceNode(nativeContext, {
                    channelCount: 1,
                    channelCountMode: 'explicit',
                    channelInterpretation: 'discrete',
                    offset: initialValue
                });
                constantSourceNode.connect(channelMergerNode, 0, input);
                // @todo This should be stopped when the context is closed.
                constantSourceNode.start();
                Object.defineProperty(constantSourceNode.offset, 'defaultValue', {
                    get() {
                        return initialValue;
                    }
                });
                /*
                 * Bug #62 & #74: Safari does not support ConstantSourceNodes and does not export the correct values for maxValue and
                 * minValue for GainNodes.
                 */
                const audioParam = createAudioParam({ context }, isOffline, constantSourceNode.offset, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
                overwriteAccessors(audioParam, 'value', (get) => () => get.call(audioParam), (set) => (value) => {
                    try {
                        set.call(audioParam, value);
                    }
                    catch (err) {
                        if (err.code !== 9) {
                            throw err;
                        }
                    }
                    createScriptProcessorNode();
                    if (isOffline) {
                        // Bug #117: Using setOrientation() and setPosition() doesn't work with an OfflineAudioContext.
                        setValue(value);
                    }
                });
                audioParam.cancelAndHoldAtTime = ((cancelAndHoldAtTime) => {
                    if (isOffline) {
                        return () => {
                            throw createNotSupportedError();
                        };
                    }
                    return (...args) => {
                        const value = cancelAndHoldAtTime.apply(audioParam, args);
                        createScriptProcessorNode();
                        return value;
                    };
                })(audioParam.cancelAndHoldAtTime);
                audioParam.cancelScheduledValues = ((cancelScheduledValues) => {
                    if (isOffline) {
                        return () => {
                            throw createNotSupportedError();
                        };
                    }
                    return (...args) => {
                        const value = cancelScheduledValues.apply(audioParam, args);
                        createScriptProcessorNode();
                        return value;
                    };
                })(audioParam.cancelScheduledValues);
                audioParam.exponentialRampToValueAtTime = ((exponentialRampToValueAtTime) => {
                    if (isOffline) {
                        return () => {
                            throw createNotSupportedError();
                        };
                    }
                    return (...args) => {
                        const value = exponentialRampToValueAtTime.apply(audioParam, args);
                        createScriptProcessorNode();
                        return value;
                    };
                })(audioParam.exponentialRampToValueAtTime);
                audioParam.linearRampToValueAtTime = ((linearRampToValueAtTime) => {
                    if (isOffline) {
                        return () => {
                            throw createNotSupportedError();
                        };
                    }
                    return (...args) => {
                        const value = linearRampToValueAtTime.apply(audioParam, args);
                        createScriptProcessorNode();
                        return value;
                    };
                })(audioParam.linearRampToValueAtTime);
                audioParam.setTargetAtTime = ((setTargetAtTime) => {
                    if (isOffline) {
                        return () => {
                            throw createNotSupportedError();
                        };
                    }
                    return (...args) => {
                        const value = setTargetAtTime.apply(audioParam, args);
                        createScriptProcessorNode();
                        return value;
                    };
                })(audioParam.setTargetAtTime);
                audioParam.setValueAtTime = ((setValueAtTime) => {
                    if (isOffline) {
                        return () => {
                            throw createNotSupportedError();
                        };
                    }
                    return (...args) => {
                        const value = setValueAtTime.apply(audioParam, args);
                        createScriptProcessorNode();
                        return value;
                    };
                })(audioParam.setValueAtTime);
                audioParam.setValueCurveAtTime = ((setValueCurveAtTime) => {
                    if (isOffline) {
                        return () => {
                            throw createNotSupportedError();
                        };
                    }
                    return (...args) => {
                        const value = setValueCurveAtTime.apply(audioParam, args);
                        createScriptProcessorNode();
                        return value;
                    };
                })(audioParam.setValueCurveAtTime);
                return audioParam;
            };
            return {
                forwardX: createFakeAudioParam(0, 0, createSetOrientation(0)),
                forwardY: createFakeAudioParam(1, 0, createSetOrientation(1)),
                forwardZ: createFakeAudioParam(2, -1, createSetOrientation(2)),
                positionX: createFakeAudioParam(6, 0, createSetPosition(0)),
                positionY: createFakeAudioParam(7, 0, createSetPosition(1)),
                positionZ: createFakeAudioParam(8, 0, createSetPosition(2)),
                upX: createFakeAudioParam(3, 0, createSetOrientation(3)),
                upY: createFakeAudioParam(4, 1, createSetOrientation(4)),
                upZ: createFakeAudioParam(5, 0, createSetOrientation(5))
            };
        };
        const { forwardX, forwardY, forwardZ, positionX, positionY, positionZ, upX, upY, upZ } = nativeListener.forwardX === undefined ? createFakeAudioParams() : nativeListener;
        return {
            get forwardX() {
                return forwardX;
            },
            get forwardY() {
                return forwardY;
            },
            get forwardZ() {
                return forwardZ;
            },
            get positionX() {
                return positionX;
            },
            get positionY() {
                return positionY;
            },
            get positionZ() {
                return positionZ;
            },
            get upX() {
                return upX;
            },
            get upY() {
                return upY;
            },
            get upZ() {
                return upZ;
            }
        };
    };
};

const isAudioNode = (audioNodeOrAudioParam) => {
    return 'context' in audioNodeOrAudioParam;
};

const isAudioNodeOutputConnection = (outputConnection) => {
    return isAudioNode(outputConnection[0]);
};

const insertElementInSet = (set, element, predicate, ignoreDuplicates) => {
    for (const lmnt of set) {
        if (predicate(lmnt)) {
            if (ignoreDuplicates) {
                return false;
            }
            throw Error('The set contains at least one similar element.');
        }
    }
    set.add(element);
    return true;
};

const addActiveInputConnectionToAudioParam = (activeInputs, source, [output, eventListener], ignoreDuplicates) => {
    insertElementInSet(activeInputs, [source, output, eventListener], (activeInputConnection) => activeInputConnection[0] === source && activeInputConnection[1] === output, ignoreDuplicates);
};

const addPassiveInputConnectionToAudioParam = (passiveInputs, [source, output, eventListener], ignoreDuplicates) => {
    const passiveInputConnections = passiveInputs.get(source);
    if (passiveInputConnections === undefined) {
        passiveInputs.set(source, new Set([[output, eventListener]]));
    }
    else {
        insertElementInSet(passiveInputConnections, [output, eventListener], (passiveInputConnection) => passiveInputConnection[0] === output, ignoreDuplicates);
    }
};

const isNativeAudioNodeFaker = (nativeAudioNodeOrNativeAudioNodeFaker) => {
    return 'inputs' in nativeAudioNodeOrNativeAudioNodeFaker;
};

const connectNativeAudioNodeToNativeAudioNode = (nativeSourceAudioNode, nativeDestinationAudioNode, output, input) => {
    if (isNativeAudioNodeFaker(nativeDestinationAudioNode)) {
        const fakeNativeDestinationAudioNode = nativeDestinationAudioNode.inputs[input];
        nativeSourceAudioNode.connect(fakeNativeDestinationAudioNode, output, 0);
        return [fakeNativeDestinationAudioNode, output, 0];
    }
    nativeSourceAudioNode.connect(nativeDestinationAudioNode, output, input);
    return [nativeDestinationAudioNode, output, input];
};

const deleteActiveInputConnection = (activeInputConnections, source, output) => {
    for (const activeInputConnection of activeInputConnections) {
        if (activeInputConnection[0] === source && activeInputConnection[1] === output) {
            activeInputConnections.delete(activeInputConnection);
            return activeInputConnection;
        }
    }
    return null;
};

const deleteActiveInputConnectionToAudioParam = (activeInputs, source, output) => {
    return pickElementFromSet(activeInputs, (activeInputConnection) => activeInputConnection[0] === source && activeInputConnection[1] === output);
};

const deleteEventListenerOfAudioNode = (audioNode, eventListener) => {
    const eventListeners = getEventListenersOfAudioNode(audioNode);
    if (!eventListeners.delete(eventListener)) {
        throw new Error('Missing the expected event listener.');
    }
};

const deletePassiveInputConnectionToAudioParam = (passiveInputs, source, output) => {
    const passiveInputConnections = getValueForKey(passiveInputs, source);
    const matchingConnection = pickElementFromSet(passiveInputConnections, (passiveInputConnection) => passiveInputConnection[0] === output);
    if (passiveInputConnections.size === 0) {
        passiveInputs.delete(source);
    }
    return matchingConnection;
};

const disconnectNativeAudioNodeFromNativeAudioNode = (nativeSourceAudioNode, nativeDestinationAudioNode, output, input) => {
    if (isNativeAudioNodeFaker(nativeDestinationAudioNode)) {
        nativeSourceAudioNode.disconnect(nativeDestinationAudioNode.inputs[input], output, 0);
    }
    else {
        nativeSourceAudioNode.disconnect(nativeDestinationAudioNode, output, input);
    }
};

const getNativeAudioNode = (audioNode) => {
    return getValueForKey(AUDIO_NODE_STORE, audioNode);
};

const getNativeAudioParam = (audioParam) => {
    return getValueForKey(AUDIO_PARAM_STORE, audioParam);
};

const isPartOfACycle = (audioNode) => {
    return CYCLE_COUNTERS.has(audioNode);
};

const isPassiveAudioNode = (audioNode) => {
    return !ACTIVE_AUDIO_NODE_STORE.has(audioNode);
};

const testAudioNodeDisconnectMethodSupport = (nativeAudioContext, nativeAudioWorkletNodeConstructor) => {
    return new Promise((resolve) => {
        /*
         * This bug existed in Safari up until v14.0.2. Since AudioWorklets were not supported in Safari until v14.1 the presence of the
         * constructor for an AudioWorkletNode can be used here to skip the test.
         */
        if (nativeAudioWorkletNodeConstructor !== null) {
            resolve(true);
        }
        else {
            const analyzer = nativeAudioContext.createScriptProcessor(256, 1, 1); // tslint:disable-line deprecation
            const dummy = nativeAudioContext.createGain();
            // Bug #95: Safari does not play one sample buffers.
            const ones = nativeAudioContext.createBuffer(1, 2, 44100);
            const channelData = ones.getChannelData(0);
            channelData[0] = 1;
            channelData[1] = 1;
            const source = nativeAudioContext.createBufferSource();
            source.buffer = ones;
            source.loop = true;
            source.connect(analyzer).connect(nativeAudioContext.destination);
            source.connect(dummy);
            source.disconnect(dummy);
            // tslint:disable-next-line:deprecation
            analyzer.onaudioprocess = (event) => {
                const chnnlDt = event.inputBuffer.getChannelData(0); // tslint:disable-line deprecation
                if (Array.prototype.some.call(chnnlDt, (sample) => sample === 1)) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
                source.stop();
                analyzer.onaudioprocess = null; // tslint:disable-line:deprecation
                source.disconnect(analyzer);
                analyzer.disconnect(nativeAudioContext.destination);
            };
            source.start();
        }
    });
};

const visitEachAudioNodeOnce = (cycles, visitor) => {
    const counts = new Map();
    for (const cycle of cycles) {
        for (const audioNode of cycle) {
            const count = counts.get(audioNode);
            counts.set(audioNode, count === undefined ? 1 : count + 1);
        }
    }
    counts.forEach((count, audioNode) => visitor(audioNode, count));
};

const isNativeAudioNode = (nativeAudioNodeOrAudioParam) => {
    return 'context' in nativeAudioNodeOrAudioParam;
};

const wrapAudioNodeDisconnectMethod = (nativeAudioNode) => {
    const connections = new Map();
    nativeAudioNode.connect = ((connect) => {
        // tslint:disable-next-line:invalid-void no-inferrable-types
        return (destination, output = 0, input = 0) => {
            const returnValue = isNativeAudioNode(destination) ? connect(destination, output, input) : connect(destination, output);
            // Save the new connection only if the calls to connect above didn't throw an error.
            const connectionsToDestination = connections.get(destination);
            if (connectionsToDestination === undefined) {
                connections.set(destination, [{ input, output }]);
            }
            else {
                if (connectionsToDestination.every((connection) => connection.input !== input || connection.output !== output)) {
                    connectionsToDestination.push({ input, output });
                }
            }
            return returnValue;
        };
    })(nativeAudioNode.connect.bind(nativeAudioNode));
    nativeAudioNode.disconnect = ((disconnect) => {
        return (destinationOrOutput, output, input) => {
            disconnect.apply(nativeAudioNode);
            if (destinationOrOutput === undefined) {
                connections.clear();
            }
            else if (typeof destinationOrOutput === 'number') {
                for (const [destination, connectionsToDestination] of connections) {
                    const filteredConnections = connectionsToDestination.filter((connection) => connection.output !== destinationOrOutput);
                    if (filteredConnections.length === 0) {
                        connections.delete(destination);
                    }
                    else {
                        connections.set(destination, filteredConnections);
                    }
                }
            }
            else if (connections.has(destinationOrOutput)) {
                if (output === undefined) {
                    connections.delete(destinationOrOutput);
                }
                else {
                    const connectionsToDestination = connections.get(destinationOrOutput);
                    if (connectionsToDestination !== undefined) {
                        const filteredConnections = connectionsToDestination.filter((connection) => connection.output !== output && (connection.input !== input || input === undefined));
                        if (filteredConnections.length === 0) {
                            connections.delete(destinationOrOutput);
                        }
                        else {
                            connections.set(destinationOrOutput, filteredConnections);
                        }
                    }
                }
            }
            for (const [destination, connectionsToDestination] of connections) {
                connectionsToDestination.forEach((connection) => {
                    if (isNativeAudioNode(destination)) {
                        nativeAudioNode.connect(destination, connection.output, connection.input);
                    }
                    else {
                        nativeAudioNode.connect(destination, connection.output);
                    }
                });
            }
        };
    })(nativeAudioNode.disconnect);
};

const addConnectionToAudioParamOfAudioContext = (source, destination, output, isOffline) => {
    const { activeInputs, passiveInputs } = getAudioParamConnections(destination);
    const { outputs } = getAudioNodeConnections(source);
    const eventListeners = getEventListenersOfAudioNode(source);
    const eventListener = (isActive) => {
        const nativeAudioNode = getNativeAudioNode(source);
        const nativeAudioParam = getNativeAudioParam(destination);
        if (isActive) {
            const partialConnection = deletePassiveInputConnectionToAudioParam(passiveInputs, source, output);
            addActiveInputConnectionToAudioParam(activeInputs, source, partialConnection, false);
            if (!isOffline && !isPartOfACycle(source)) {
                nativeAudioNode.connect(nativeAudioParam, output);
            }
        }
        else {
            const partialConnection = deleteActiveInputConnectionToAudioParam(activeInputs, source, output);
            addPassiveInputConnectionToAudioParam(passiveInputs, partialConnection, false);
            if (!isOffline && !isPartOfACycle(source)) {
                nativeAudioNode.disconnect(nativeAudioParam, output);
            }
        }
    };
    if (insertElementInSet(outputs, [destination, output], (outputConnection) => outputConnection[0] === destination && outputConnection[1] === output, true)) {
        eventListeners.add(eventListener);
        if (isActiveAudioNode(source)) {
            addActiveInputConnectionToAudioParam(activeInputs, source, [output, eventListener], true);
        }
        else {
            addPassiveInputConnectionToAudioParam(passiveInputs, [source, output, eventListener], true);
        }
        return true;
    }
    return false;
};
const deleteInputConnectionOfAudioNode = (source, destination, output, input) => {
    const { activeInputs, passiveInputs } = getAudioNodeConnections(destination);
    const activeInputConnection = deleteActiveInputConnection(activeInputs[input], source, output);
    if (activeInputConnection === null) {
        const passiveInputConnection = deletePassiveInputConnectionToAudioNode(passiveInputs, source, output, input);
        return [passiveInputConnection[2], false];
    }
    return [activeInputConnection[2], true];
};
const deleteInputConnectionOfAudioParam = (source, destination, output) => {
    const { activeInputs, passiveInputs } = getAudioParamConnections(destination);
    const activeInputConnection = deleteActiveInputConnection(activeInputs, source, output);
    if (activeInputConnection === null) {
        const passiveInputConnection = deletePassiveInputConnectionToAudioParam(passiveInputs, source, output);
        return [passiveInputConnection[1], false];
    }
    return [activeInputConnection[2], true];
};
const deleteInputsOfAudioNode = (source, isOffline, destination, output, input) => {
    const [listener, isActive] = deleteInputConnectionOfAudioNode(source, destination, output, input);
    if (listener !== null) {
        deleteEventListenerOfAudioNode(source, listener);
        if (isActive && !isOffline && !isPartOfACycle(source)) {
            disconnectNativeAudioNodeFromNativeAudioNode(getNativeAudioNode(source), getNativeAudioNode(destination), output, input);
        }
    }
    if (isActiveAudioNode(destination)) {
        const { activeInputs } = getAudioNodeConnections(destination);
        setInternalStateToPassiveWhenNecessary(destination, activeInputs);
    }
};
const deleteInputsOfAudioParam = (source, isOffline, destination, output) => {
    const [listener, isActive] = deleteInputConnectionOfAudioParam(source, destination, output);
    if (listener !== null) {
        deleteEventListenerOfAudioNode(source, listener);
        if (isActive && !isOffline && !isPartOfACycle(source)) {
            getNativeAudioNode(source).disconnect(getNativeAudioParam(destination), output);
        }
    }
};
const deleteAnyConnection = (source, isOffline) => {
    const audioNodeConnectionsOfSource = getAudioNodeConnections(source);
    const destinations = [];
    for (const outputConnection of audioNodeConnectionsOfSource.outputs) {
        if (isAudioNodeOutputConnection(outputConnection)) {
            deleteInputsOfAudioNode(source, isOffline, ...outputConnection);
        }
        else {
            deleteInputsOfAudioParam(source, isOffline, ...outputConnection);
        }
        destinations.push(outputConnection[0]);
    }
    audioNodeConnectionsOfSource.outputs.clear();
    return destinations;
};
const deleteConnectionAtOutput = (source, isOffline, output) => {
    const audioNodeConnectionsOfSource = getAudioNodeConnections(source);
    const destinations = [];
    for (const outputConnection of audioNodeConnectionsOfSource.outputs) {
        if (outputConnection[1] === output) {
            if (isAudioNodeOutputConnection(outputConnection)) {
                deleteInputsOfAudioNode(source, isOffline, ...outputConnection);
            }
            else {
                deleteInputsOfAudioParam(source, isOffline, ...outputConnection);
            }
            destinations.push(outputConnection[0]);
            audioNodeConnectionsOfSource.outputs.delete(outputConnection);
        }
    }
    return destinations;
};
const deleteConnectionToDestination = (source, isOffline, destination, output, input) => {
    const audioNodeConnectionsOfSource = getAudioNodeConnections(source);
    return Array.from(audioNodeConnectionsOfSource.outputs)
        .filter((outputConnection) => outputConnection[0] === destination &&
        (output === undefined || outputConnection[1] === output) &&
        (input === undefined || outputConnection[2] === input))
        .map((outputConnection) => {
        if (isAudioNodeOutputConnection(outputConnection)) {
            deleteInputsOfAudioNode(source, isOffline, ...outputConnection);
        }
        else {
            deleteInputsOfAudioParam(source, isOffline, ...outputConnection);
        }
        audioNodeConnectionsOfSource.outputs.delete(outputConnection);
        return outputConnection[0];
    });
};
const createAudioNodeConstructor = (addAudioNodeConnections, addConnectionToAudioNode, cacheTestResult, createIncrementCycleCounter, createIndexSizeError, createInvalidAccessError, createNotSupportedError, decrementCycleCounter, detectCycles, eventTargetConstructor, getNativeContext, isNativeAudioContext, isNativeAudioNode, isNativeAudioParam, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor) => {
    return class AudioNode extends eventTargetConstructor {
        constructor(context, isActive, nativeAudioNode, audioNodeRenderer) {
            super(nativeAudioNode);
            this._context = context;
            this._nativeAudioNode = nativeAudioNode;
            const nativeContext = getNativeContext(context);
            // Bug #12: Safari does not support to disconnect a specific destination.
            if (isNativeAudioContext(nativeContext) &&
                true !==
                    cacheTestResult(testAudioNodeDisconnectMethodSupport, () => {
                        return testAudioNodeDisconnectMethodSupport(nativeContext, nativeAudioWorkletNodeConstructor);
                    })) {
                wrapAudioNodeDisconnectMethod(nativeAudioNode);
            }
            AUDIO_NODE_STORE.set(this, nativeAudioNode);
            EVENT_LISTENERS.set(this, new Set());
            if (context.state !== 'closed' && isActive) {
                setInternalStateToActive(this);
            }
            addAudioNodeConnections(this, audioNodeRenderer, nativeAudioNode);
        }
        get channelCount() {
            return this._nativeAudioNode.channelCount;
        }
        set channelCount(value) {
            this._nativeAudioNode.channelCount = value;
        }
        get channelCountMode() {
            return this._nativeAudioNode.channelCountMode;
        }
        set channelCountMode(value) {
            this._nativeAudioNode.channelCountMode = value;
        }
        get channelInterpretation() {
            return this._nativeAudioNode.channelInterpretation;
        }
        set channelInterpretation(value) {
            this._nativeAudioNode.channelInterpretation = value;
        }
        get context() {
            return this._context;
        }
        get numberOfInputs() {
            return this._nativeAudioNode.numberOfInputs;
        }
        get numberOfOutputs() {
            return this._nativeAudioNode.numberOfOutputs;
        }
        // tslint:disable-next-line:invalid-void
        connect(destination, output = 0, input = 0) {
            // Bug #174: Safari does expose a wrong numberOfOutputs for MediaStreamAudioDestinationNodes.
            if (output < 0 || output >= this._nativeAudioNode.numberOfOutputs) {
                throw createIndexSizeError();
            }
            const nativeContext = getNativeContext(this._context);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            if (isNativeAudioNode(destination) || isNativeAudioParam(destination)) {
                throw createInvalidAccessError();
            }
            if (isAudioNode(destination)) {
                const nativeDestinationAudioNode = getNativeAudioNode(destination);
                try {
                    const connection = connectNativeAudioNodeToNativeAudioNode(this._nativeAudioNode, nativeDestinationAudioNode, output, input);
                    const isPassive = isPassiveAudioNode(this);
                    if (isOffline || isPassive) {
                        this._nativeAudioNode.disconnect(...connection);
                    }
                    if (this.context.state !== 'closed' && !isPassive && isPassiveAudioNode(destination)) {
                        setInternalStateToActive(destination);
                    }
                }
                catch (err) {
                    // Bug #41: Safari does not throw the correct exception so far.
                    if (err.code === 12) {
                        throw createInvalidAccessError();
                    }
                    throw err;
                }
                const isNewConnectionToAudioNode = addConnectionToAudioNode(this, destination, output, input, isOffline);
                // Bug #164: Only Firefox detects cycles so far.
                if (isNewConnectionToAudioNode) {
                    const cycles = detectCycles([this], destination);
                    visitEachAudioNodeOnce(cycles, createIncrementCycleCounter(isOffline));
                }
                return destination;
            }
            const nativeAudioParam = getNativeAudioParam(destination);
            /*
             * Bug #73, #147 & #153: Safari does not support to connect an input signal to the playbackRate AudioParam of an
             * AudioBufferSourceNode. This can't be easily detected and that's why the outdated name property is used here to identify
             * Safari. In addition to that the maxValue property is used to only detect the affected versions below v14.0.2.
             */
            if (nativeAudioParam.name === 'playbackRate' && nativeAudioParam.maxValue === 1024) {
                throw createNotSupportedError();
            }
            try {
                this._nativeAudioNode.connect(nativeAudioParam, output);
                if (isOffline || isPassiveAudioNode(this)) {
                    this._nativeAudioNode.disconnect(nativeAudioParam, output);
                }
            }
            catch (err) {
                // Bug #58: Safari doesn't throw an InvalidAccessError yet.
                if (err.code === 12) {
                    throw createInvalidAccessError();
                }
                throw err;
            }
            const isNewConnectionToAudioParam = addConnectionToAudioParamOfAudioContext(this, destination, output, isOffline);
            // Bug #164: Only Firefox detects cycles so far.
            if (isNewConnectionToAudioParam) {
                const cycles = detectCycles([this], destination);
                visitEachAudioNodeOnce(cycles, createIncrementCycleCounter(isOffline));
            }
        }
        disconnect(destinationOrOutput, output, input) {
            let destinations;
            const nativeContext = getNativeContext(this._context);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            if (destinationOrOutput === undefined) {
                destinations = deleteAnyConnection(this, isOffline);
            }
            else if (typeof destinationOrOutput === 'number') {
                if (destinationOrOutput < 0 || destinationOrOutput >= this.numberOfOutputs) {
                    throw createIndexSizeError();
                }
                destinations = deleteConnectionAtOutput(this, isOffline, destinationOrOutput);
            }
            else {
                if (output !== undefined && (output < 0 || output >= this.numberOfOutputs)) {
                    throw createIndexSizeError();
                }
                if (isAudioNode(destinationOrOutput) && input !== undefined && (input < 0 || input >= destinationOrOutput.numberOfInputs)) {
                    throw createIndexSizeError();
                }
                destinations = deleteConnectionToDestination(this, isOffline, destinationOrOutput, output, input);
                if (destinations.length === 0) {
                    throw createInvalidAccessError();
                }
            }
            // Bug #164: Only Firefox detects cycles so far.
            for (const destination of destinations) {
                const cycles = detectCycles([this], destination);
                visitEachAudioNodeOnce(cycles, decrementCycleCounter);
            }
        }
    };
};

const createAudioParamFactory = (addAudioParamConnections, audioParamAudioNodeStore, audioParamStore, createAudioParamRenderer, createCancelAndHoldAutomationEvent, createCancelScheduledValuesAutomationEvent, createExponentialRampToValueAutomationEvent, createLinearRampToValueAutomationEvent, createSetTargetAutomationEvent, createSetValueAutomationEvent, createSetValueCurveAutomationEvent, nativeAudioContextConstructor, setValueAtTimeUntilPossible) => {
    return (audioNode, isAudioParamOfOfflineAudioContext, nativeAudioParam, maxValue = null, minValue = null) => {
        const automationEventList = new AutomationEventList(nativeAudioParam.defaultValue);
        const audioParamRenderer = isAudioParamOfOfflineAudioContext ? createAudioParamRenderer(automationEventList) : null;
        const audioParam = {
            get defaultValue() {
                return nativeAudioParam.defaultValue;
            },
            get maxValue() {
                return maxValue === null ? nativeAudioParam.maxValue : maxValue;
            },
            get minValue() {
                return minValue === null ? nativeAudioParam.minValue : minValue;
            },
            get value() {
                return nativeAudioParam.value;
            },
            set value(value) {
                nativeAudioParam.value = value;
                // Bug #98: Firefox & Safari do not yet treat the value setter like a call to setValueAtTime().
                audioParam.setValueAtTime(value, audioNode.context.currentTime);
            },
            cancelAndHoldAtTime(cancelTime) {
                // Bug #28: Firefox & Safari do not yet implement cancelAndHoldAtTime().
                if (typeof nativeAudioParam.cancelAndHoldAtTime === 'function') {
                    if (audioParamRenderer === null) {
                        automationEventList.flush(audioNode.context.currentTime);
                    }
                    automationEventList.add(createCancelAndHoldAutomationEvent(cancelTime));
                    nativeAudioParam.cancelAndHoldAtTime(cancelTime);
                }
                else {
                    const previousLastEvent = Array.from(automationEventList).pop();
                    if (audioParamRenderer === null) {
                        automationEventList.flush(audioNode.context.currentTime);
                    }
                    automationEventList.add(createCancelAndHoldAutomationEvent(cancelTime));
                    const currentLastEvent = Array.from(automationEventList).pop();
                    nativeAudioParam.cancelScheduledValues(cancelTime);
                    if (previousLastEvent !== currentLastEvent && currentLastEvent !== undefined) {
                        if (currentLastEvent.type === 'exponentialRampToValue') {
                            nativeAudioParam.exponentialRampToValueAtTime(currentLastEvent.value, currentLastEvent.endTime);
                        }
                        else if (currentLastEvent.type === 'linearRampToValue') {
                            nativeAudioParam.linearRampToValueAtTime(currentLastEvent.value, currentLastEvent.endTime);
                        }
                        else if (currentLastEvent.type === 'setValue') {
                            nativeAudioParam.setValueAtTime(currentLastEvent.value, currentLastEvent.startTime);
                        }
                        else if (currentLastEvent.type === 'setValueCurve') {
                            nativeAudioParam.setValueCurveAtTime(currentLastEvent.values, currentLastEvent.startTime, currentLastEvent.duration);
                        }
                    }
                }
                return audioParam;
            },
            cancelScheduledValues(cancelTime) {
                if (audioParamRenderer === null) {
                    automationEventList.flush(audioNode.context.currentTime);
                }
                automationEventList.add(createCancelScheduledValuesAutomationEvent(cancelTime));
                nativeAudioParam.cancelScheduledValues(cancelTime);
                return audioParam;
            },
            exponentialRampToValueAtTime(value, endTime) {
                // Bug #45: Safari does not throw an error yet.
                if (value === 0) {
                    throw new RangeError();
                }
                // Bug #187: Safari does not throw an error yet.
                if (!Number.isFinite(endTime) || endTime < 0) {
                    throw new RangeError();
                }
                if (audioParamRenderer === null) {
                    automationEventList.flush(audioNode.context.currentTime);
                }
                automationEventList.add(createExponentialRampToValueAutomationEvent(value, endTime));
                nativeAudioParam.exponentialRampToValueAtTime(value, endTime);
                return audioParam;
            },
            linearRampToValueAtTime(value, endTime) {
                if (audioParamRenderer === null) {
                    automationEventList.flush(audioNode.context.currentTime);
                }
                automationEventList.add(createLinearRampToValueAutomationEvent(value, endTime));
                nativeAudioParam.linearRampToValueAtTime(value, endTime);
                return audioParam;
            },
            setTargetAtTime(target, startTime, timeConstant) {
                if (audioParamRenderer === null) {
                    automationEventList.flush(audioNode.context.currentTime);
                }
                automationEventList.add(createSetTargetAutomationEvent(target, startTime, timeConstant));
                nativeAudioParam.setTargetAtTime(target, startTime, timeConstant);
                return audioParam;
            },
            setValueAtTime(value, startTime) {
                if (audioParamRenderer === null) {
                    automationEventList.flush(audioNode.context.currentTime);
                }
                automationEventList.add(createSetValueAutomationEvent(value, startTime));
                nativeAudioParam.setValueAtTime(value, startTime);
                return audioParam;
            },
            setValueCurveAtTime(values, startTime, duration) {
                // Bug 183: Safari only accepts a Float32Array.
                const convertedValues = values instanceof Float32Array ? values : new Float32Array(values);
                /*
                 * Bug #152: Safari does not correctly interpolate the values of the curve.
                 * @todo Unfortunately there is no way to test for this behavior in a synchronous fashion which is why testing for the
                 * existence of the webkitAudioContext is used as a workaround here.
                 */
                if (nativeAudioContextConstructor !== null && nativeAudioContextConstructor.name === 'webkitAudioContext') {
                    const endTime = startTime + duration;
                    const sampleRate = audioNode.context.sampleRate;
                    const firstSample = Math.ceil(startTime * sampleRate);
                    const lastSample = Math.floor(endTime * sampleRate);
                    const numberOfInterpolatedValues = lastSample - firstSample;
                    const interpolatedValues = new Float32Array(numberOfInterpolatedValues);
                    for (let i = 0; i < numberOfInterpolatedValues; i += 1) {
                        const theoreticIndex = ((convertedValues.length - 1) / duration) * ((firstSample + i) / sampleRate - startTime);
                        const lowerIndex = Math.floor(theoreticIndex);
                        const upperIndex = Math.ceil(theoreticIndex);
                        interpolatedValues[i] =
                            lowerIndex === upperIndex
                                ? convertedValues[lowerIndex]
                                : (1 - (theoreticIndex - lowerIndex)) * convertedValues[lowerIndex] +
                                    (1 - (upperIndex - theoreticIndex)) * convertedValues[upperIndex];
                    }
                    if (audioParamRenderer === null) {
                        automationEventList.flush(audioNode.context.currentTime);
                    }
                    automationEventList.add(createSetValueCurveAutomationEvent(interpolatedValues, startTime, duration));
                    nativeAudioParam.setValueCurveAtTime(interpolatedValues, startTime, duration);
                    const timeOfLastSample = lastSample / sampleRate;
                    if (timeOfLastSample < endTime) {
                        setValueAtTimeUntilPossible(audioParam, interpolatedValues[interpolatedValues.length - 1], timeOfLastSample);
                    }
                    setValueAtTimeUntilPossible(audioParam, convertedValues[convertedValues.length - 1], endTime);
                }
                else {
                    if (audioParamRenderer === null) {
                        automationEventList.flush(audioNode.context.currentTime);
                    }
                    automationEventList.add(createSetValueCurveAutomationEvent(convertedValues, startTime, duration));
                    nativeAudioParam.setValueCurveAtTime(convertedValues, startTime, duration);
                }
                return audioParam;
            }
        };
        audioParamStore.set(audioParam, nativeAudioParam);
        audioParamAudioNodeStore.set(audioParam, audioNode);
        addAudioParamConnections(audioParam, audioParamRenderer);
        return audioParam;
    };
};

const createAudioParamRenderer = (automationEventList) => {
    return {
        replay(audioParam) {
            for (const automationEvent of automationEventList) {
                if (automationEvent.type === 'exponentialRampToValue') {
                    const { endTime, value } = automationEvent;
                    audioParam.exponentialRampToValueAtTime(value, endTime);
                }
                else if (automationEvent.type === 'linearRampToValue') {
                    const { endTime, value } = automationEvent;
                    audioParam.linearRampToValueAtTime(value, endTime);
                }
                else if (automationEvent.type === 'setTarget') {
                    const { startTime, target, timeConstant } = automationEvent;
                    audioParam.setTargetAtTime(target, startTime, timeConstant);
                }
                else if (automationEvent.type === 'setValue') {
                    const { startTime, value } = automationEvent;
                    audioParam.setValueAtTime(value, startTime);
                }
                else if (automationEvent.type === 'setValueCurve') {
                    const { duration, startTime, values } = automationEvent;
                    audioParam.setValueCurveAtTime(values, startTime, duration);
                }
                else {
                    throw new Error("Can't apply an unknown automation.");
                }
            }
        }
    };
};

class ReadOnlyMap {
    constructor(parameters) {
        this._map = new Map(parameters);
    }
    get size() {
        return this._map.size;
    }
    entries() {
        return this._map.entries();
    }
    forEach(callback, thisArg = null) {
        return this._map.forEach((value, key) => callback.call(thisArg, value, key, this));
    }
    get(name) {
        return this._map.get(name);
    }
    has(name) {
        return this._map.has(name);
    }
    keys() {
        return this._map.keys();
    }
    values() {
        return this._map.values();
    }
}

const DEFAULT_OPTIONS$3 = {
    channelCount: 2,
    // Bug #61: The channelCountMode should be 'max' according to the spec but is set to 'explicit' to achieve consistent behavior.
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
    numberOfInputs: 1,
    numberOfOutputs: 1,
    parameterData: {},
    processorOptions: {}
};
const createAudioWorkletNodeConstructor = (addUnrenderedAudioWorkletNode, audioNodeConstructor, createAudioParam, createAudioWorkletNodeRenderer, createNativeAudioWorkletNode, getAudioNodeConnections, getBackupOfflineAudioContext, getNativeContext, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor, sanitizeAudioWorkletNodeOptions, setActiveAudioWorkletNodeInputs, testAudioWorkletNodeOptionsClonability, wrapEventListener) => {
    return class AudioWorkletNode extends audioNodeConstructor {
        constructor(context, name, options) {
            var _a;
            const nativeContext = getNativeContext(context);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const mergedOptions = sanitizeAudioWorkletNodeOptions({ ...DEFAULT_OPTIONS$3, ...options });
            // Bug #191: Safari doesn't throw an error if the options aren't clonable.
            testAudioWorkletNodeOptionsClonability(mergedOptions);
            const nodeNameToProcessorConstructorMap = NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS.get(nativeContext);
            const processorConstructor = nodeNameToProcessorConstructorMap === null || nodeNameToProcessorConstructorMap === void 0 ? void 0 : nodeNameToProcessorConstructorMap.get(name);
            // Bug #186: Chrome, Edge and Opera do not allow to create an AudioWorkletNode on a closed AudioContext.
            const nativeContextOrBackupOfflineAudioContext = isOffline || nativeContext.state !== 'closed'
                ? nativeContext
                : (_a = getBackupOfflineAudioContext(nativeContext)) !== null && _a !== void 0 ? _a : nativeContext;
            const nativeAudioWorkletNode = createNativeAudioWorkletNode(nativeContextOrBackupOfflineAudioContext, isOffline ? null : context.baseLatency, nativeAudioWorkletNodeConstructor, name, processorConstructor, mergedOptions);
            const audioWorkletNodeRenderer = ((isOffline ? createAudioWorkletNodeRenderer(name, mergedOptions, processorConstructor) : null));
            /*
             * @todo Add a mechanism to switch an AudioWorkletNode to passive once the process() function of the AudioWorkletProcessor
             * returns false.
             */
            super(context, true, nativeAudioWorkletNode, audioWorkletNodeRenderer);
            const parameters = [];
            nativeAudioWorkletNode.parameters.forEach((nativeAudioParam, nm) => {
                const audioParam = createAudioParam(this, isOffline, nativeAudioParam);
                parameters.push([nm, audioParam]);
            });
            this._nativeAudioWorkletNode = nativeAudioWorkletNode;
            this._onprocessorerror = null;
            this._parameters = new ReadOnlyMap(parameters);
            /*
             * Bug #86 & #87: Invoking the renderer of an AudioWorkletNode might be necessary if it has no direct or indirect connection to
             * the destination.
             */
            if (isOffline) {
                addUnrenderedAudioWorkletNode(nativeContext, this);
            }
            const { activeInputs } = getAudioNodeConnections(this);
            setActiveAudioWorkletNodeInputs(nativeAudioWorkletNode, activeInputs);
        }
        get onprocessorerror() {
            return this._onprocessorerror;
        }
        set onprocessorerror(value) {
            const wrappedListener = typeof value === 'function' ? wrapEventListener(this, value) : null;
            this._nativeAudioWorkletNode.onprocessorerror = wrappedListener;
            const nativeOnProcessorError = this._nativeAudioWorkletNode.onprocessorerror;
            this._onprocessorerror =
                nativeOnProcessorError !== null && nativeOnProcessorError === wrappedListener
                    ? value
                    : nativeOnProcessorError;
        }
        get parameters() {
            if (this._parameters === null) {
                // @todo The definition that TypeScript uses of the AudioParamMap is lacking many methods.
                return this._nativeAudioWorkletNode.parameters;
            }
            return this._parameters;
        }
        get port() {
            return this._nativeAudioWorkletNode.port;
        }
    };
};

function copyFromChannel(audioBuffer, 
// @todo There is currently no way to define something like { [ key: number | string ]: Float32Array }
parent, key, channelNumber, bufferOffset) {
    if (typeof audioBuffer.copyFromChannel === 'function') {
        // The byteLength will be 0 when the ArrayBuffer was transferred.
        if (parent[key].byteLength === 0) {
            parent[key] = new Float32Array(128);
        }
        audioBuffer.copyFromChannel(parent[key], channelNumber, bufferOffset);
        // Bug #5: Safari does not support copyFromChannel().
    }
    else {
        const channelData = audioBuffer.getChannelData(channelNumber);
        // The byteLength will be 0 when the ArrayBuffer was transferred.
        if (parent[key].byteLength === 0) {
            parent[key] = channelData.slice(bufferOffset, bufferOffset + 128);
        }
        else {
            const slicedInput = new Float32Array(channelData.buffer, bufferOffset * Float32Array.BYTES_PER_ELEMENT, 128);
            parent[key].set(slicedInput);
        }
    }
}

const copyToChannel = (audioBuffer, parent, key, channelNumber, bufferOffset) => {
    if (typeof audioBuffer.copyToChannel === 'function') {
        // The byteLength will be 0 when the ArrayBuffer was transferred.
        if (parent[key].byteLength !== 0) {
            audioBuffer.copyToChannel(parent[key], channelNumber, bufferOffset);
        }
        // Bug #5: Safari does not support copyToChannel().
    }
    else {
        // The byteLength will be 0 when the ArrayBuffer was transferred.
        if (parent[key].byteLength !== 0) {
            audioBuffer.getChannelData(channelNumber).set(parent[key], bufferOffset);
        }
    }
};

const createNestedArrays = (x, y) => {
    const arrays = [];
    for (let i = 0; i < x; i += 1) {
        const array = [];
        const length = typeof y === 'number' ? y : y[i];
        for (let j = 0; j < length; j += 1) {
            array.push(new Float32Array(128));
        }
        arrays.push(array);
    }
    return arrays;
};

const getAudioWorkletProcessor = (nativeOfflineAudioContext, proxy) => {
    const nodeToProcessorMap = getValueForKey(NODE_TO_PROCESSOR_MAPS, nativeOfflineAudioContext);
    const nativeAudioWorkletNode = getNativeAudioNode(proxy);
    return getValueForKey(nodeToProcessorMap, nativeAudioWorkletNode);
};

const processBuffer = async (proxy, renderedBuffer, nativeOfflineAudioContext, options, outputChannelCount, processorConstructor, exposeCurrentFrameAndCurrentTime) => {
    // Ceil the length to the next full render quantum.
    // Bug #17: Safari does not yet expose the length.
    const length = renderedBuffer === null ? Math.ceil(proxy.context.length / 128) * 128 : renderedBuffer.length;
    const numberOfInputChannels = options.channelCount * options.numberOfInputs;
    const numberOfOutputChannels = outputChannelCount.reduce((sum, value) => sum + value, 0);
    const processedBuffer = numberOfOutputChannels === 0
        ? null
        : nativeOfflineAudioContext.createBuffer(numberOfOutputChannels, length, nativeOfflineAudioContext.sampleRate);
    if (processorConstructor === undefined) {
        throw new Error('Missing the processor constructor.');
    }
    const audioNodeConnections = getAudioNodeConnections(proxy);
    const audioWorkletProcessor = await getAudioWorkletProcessor(nativeOfflineAudioContext, proxy);
    const inputs = createNestedArrays(options.numberOfInputs, options.channelCount);
    const outputs = createNestedArrays(options.numberOfOutputs, outputChannelCount);
    const parameters = Array.from(proxy.parameters.keys()).reduce((prmtrs, name) => ({ ...prmtrs, [name]: new Float32Array(128) }), {});
    for (let i = 0; i < length; i += 128) {
        if (options.numberOfInputs > 0 && renderedBuffer !== null) {
            for (let j = 0; j < options.numberOfInputs; j += 1) {
                for (let k = 0; k < options.channelCount; k += 1) {
                    copyFromChannel(renderedBuffer, inputs[j], k, k, i);
                }
            }
        }
        if (processorConstructor.parameterDescriptors !== undefined && renderedBuffer !== null) {
            processorConstructor.parameterDescriptors.forEach(({ name }, index) => {
                copyFromChannel(renderedBuffer, parameters, name, numberOfInputChannels + index, i);
            });
        }
        for (let j = 0; j < options.numberOfInputs; j += 1) {
            for (let k = 0; k < outputChannelCount[j]; k += 1) {
                // The byteLength will be 0 when the ArrayBuffer was transferred.
                if (outputs[j][k].byteLength === 0) {
                    outputs[j][k] = new Float32Array(128);
                }
            }
        }
        try {
            const potentiallyEmptyInputs = inputs.map((input, index) => {
                if (audioNodeConnections.activeInputs[index].size === 0) {
                    return [];
                }
                return input;
            });
            const activeSourceFlag = exposeCurrentFrameAndCurrentTime(i / nativeOfflineAudioContext.sampleRate, nativeOfflineAudioContext.sampleRate, () => audioWorkletProcessor.process(potentiallyEmptyInputs, outputs, parameters));
            if (processedBuffer !== null) {
                for (let j = 0, outputChannelSplitterNodeOutput = 0; j < options.numberOfOutputs; j += 1) {
                    for (let k = 0; k < outputChannelCount[j]; k += 1) {
                        copyToChannel(processedBuffer, outputs[j], k, outputChannelSplitterNodeOutput + k, i);
                    }
                    outputChannelSplitterNodeOutput += outputChannelCount[j];
                }
            }
            if (!activeSourceFlag) {
                break;
            }
        }
        catch (error) {
            proxy.dispatchEvent(new ErrorEvent('processorerror', {
                colno: error.colno,
                filename: error.filename,
                lineno: error.lineno,
                message: error.message
            }));
            break;
        }
    }
    return processedBuffer;
};
const createAudioWorkletNodeRendererFactory = (connectAudioParam, connectMultipleOutputs, createNativeAudioBufferSourceNode, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, deleteUnrenderedAudioWorkletNode, disconnectMultipleOutputs, exposeCurrentFrameAndCurrentTime, getNativeAudioNode, nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor, renderAutomation, renderInputsOfAudioNode, renderNativeOfflineAudioContext) => {
    return (name, options, processorConstructor) => {
        const renderedNativeAudioNodes = new WeakMap();
        let processedBufferPromise = null;
        const createAudioNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeAudioWorkletNode = getNativeAudioNode(proxy);
            let nativeOutputNodes = null;
            const nativeAudioWorkletNodeIsOwnedByContext = isOwnedByContext(nativeAudioWorkletNode, nativeOfflineAudioContext);
            const outputChannelCount = Array.isArray(options.outputChannelCount)
                ? options.outputChannelCount
                : Array.from(options.outputChannelCount);
            // Bug #61: Only Chrome, Edge, Firefox & Opera have an implementation of the AudioWorkletNode yet.
            if (nativeAudioWorkletNodeConstructor === null) {
                const numberOfOutputChannels = outputChannelCount.reduce((sum, value) => sum + value, 0);
                const outputChannelSplitterNode = createNativeChannelSplitterNode(nativeOfflineAudioContext, {
                    channelCount: Math.max(1, numberOfOutputChannels),
                    channelCountMode: 'explicit',
                    channelInterpretation: 'discrete',
                    numberOfOutputs: Math.max(1, numberOfOutputChannels)
                });
                const outputChannelMergerNodes = [];
                for (let i = 0; i < proxy.numberOfOutputs; i += 1) {
                    outputChannelMergerNodes.push(createNativeChannelMergerNode(nativeOfflineAudioContext, {
                        channelCount: 1,
                        channelCountMode: 'explicit',
                        channelInterpretation: 'speakers',
                        numberOfInputs: outputChannelCount[i]
                    }));
                }
                const outputGainNode = createNativeGainNode(nativeOfflineAudioContext, {
                    channelCount: options.channelCount,
                    channelCountMode: options.channelCountMode,
                    channelInterpretation: options.channelInterpretation,
                    gain: 1
                });
                outputGainNode.connect = connectMultipleOutputs.bind(null, outputChannelMergerNodes);
                outputGainNode.disconnect = disconnectMultipleOutputs.bind(null, outputChannelMergerNodes);
                nativeOutputNodes = [outputChannelSplitterNode, outputChannelMergerNodes, outputGainNode];
            }
            else if (!nativeAudioWorkletNodeIsOwnedByContext) {
                nativeAudioWorkletNode = new nativeAudioWorkletNodeConstructor(nativeOfflineAudioContext, name);
            }
            renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeOutputNodes === null ? nativeAudioWorkletNode : nativeOutputNodes[2]);
            if (nativeOutputNodes !== null) {
                if (processedBufferPromise === null) {
                    if (processorConstructor === undefined) {
                        throw new Error('Missing the processor constructor.');
                    }
                    if (nativeOfflineAudioContextConstructor === null) {
                        throw new Error('Missing the native OfflineAudioContext constructor.');
                    }
                    // Bug #47: The AudioDestinationNode in Safari gets not initialized correctly.
                    const numberOfInputChannels = proxy.channelCount * proxy.numberOfInputs;
                    const numberOfParameters = processorConstructor.parameterDescriptors === undefined ? 0 : processorConstructor.parameterDescriptors.length;
                    const numberOfChannels = numberOfInputChannels + numberOfParameters;
                    const renderBuffer = async () => {
                        const partialOfflineAudioContext = new nativeOfflineAudioContextConstructor(numberOfChannels, 
                        // Ceil the length to the next full render quantum.
                        // Bug #17: Safari does not yet expose the length.
                        Math.ceil(proxy.context.length / 128) * 128, nativeOfflineAudioContext.sampleRate);
                        const gainNodes = [];
                        const inputChannelSplitterNodes = [];
                        for (let i = 0; i < options.numberOfInputs; i += 1) {
                            gainNodes.push(createNativeGainNode(partialOfflineAudioContext, {
                                channelCount: options.channelCount,
                                channelCountMode: options.channelCountMode,
                                channelInterpretation: options.channelInterpretation,
                                gain: 1
                            }));
                            inputChannelSplitterNodes.push(createNativeChannelSplitterNode(partialOfflineAudioContext, {
                                channelCount: options.channelCount,
                                channelCountMode: 'explicit',
                                channelInterpretation: 'discrete',
                                numberOfOutputs: options.channelCount
                            }));
                        }
                        const constantSourceNodes = await Promise.all(Array.from(proxy.parameters.values()).map(async (audioParam) => {
                            const constantSourceNode = createNativeConstantSourceNode(partialOfflineAudioContext, {
                                channelCount: 1,
                                channelCountMode: 'explicit',
                                channelInterpretation: 'discrete',
                                offset: audioParam.value
                            });
                            await renderAutomation(partialOfflineAudioContext, audioParam, constantSourceNode.offset);
                            return constantSourceNode;
                        }));
                        const inputChannelMergerNode = createNativeChannelMergerNode(partialOfflineAudioContext, {
                            channelCount: 1,
                            channelCountMode: 'explicit',
                            channelInterpretation: 'speakers',
                            numberOfInputs: Math.max(1, numberOfInputChannels + numberOfParameters)
                        });
                        for (let i = 0; i < options.numberOfInputs; i += 1) {
                            gainNodes[i].connect(inputChannelSplitterNodes[i]);
                            for (let j = 0; j < options.channelCount; j += 1) {
                                inputChannelSplitterNodes[i].connect(inputChannelMergerNode, j, i * options.channelCount + j);
                            }
                        }
                        for (const [index, constantSourceNode] of constantSourceNodes.entries()) {
                            constantSourceNode.connect(inputChannelMergerNode, 0, numberOfInputChannels + index);
                            constantSourceNode.start(0);
                        }
                        inputChannelMergerNode.connect(partialOfflineAudioContext.destination);
                        await Promise.all(gainNodes.map((gainNode) => renderInputsOfAudioNode(proxy, partialOfflineAudioContext, gainNode)));
                        return renderNativeOfflineAudioContext(partialOfflineAudioContext);
                    };
                    processedBufferPromise = processBuffer(proxy, numberOfChannels === 0 ? null : await renderBuffer(), nativeOfflineAudioContext, options, outputChannelCount, processorConstructor, exposeCurrentFrameAndCurrentTime);
                }
                const processedBuffer = await processedBufferPromise;
                const audioBufferSourceNode = createNativeAudioBufferSourceNode(nativeOfflineAudioContext, {
                    buffer: null,
                    channelCount: 2,
                    channelCountMode: 'max',
                    channelInterpretation: 'speakers',
                    loop: false,
                    loopEnd: 0,
                    loopStart: 0,
                    playbackRate: 1
                });
                const [outputChannelSplitterNode, outputChannelMergerNodes, outputGainNode] = nativeOutputNodes;
                if (processedBuffer !== null) {
                    audioBufferSourceNode.buffer = processedBuffer;
                    audioBufferSourceNode.start(0);
                }
                audioBufferSourceNode.connect(outputChannelSplitterNode);
                for (let i = 0, outputChannelSplitterNodeOutput = 0; i < proxy.numberOfOutputs; i += 1) {
                    const outputChannelMergerNode = outputChannelMergerNodes[i];
                    for (let j = 0; j < outputChannelCount[i]; j += 1) {
                        outputChannelSplitterNode.connect(outputChannelMergerNode, outputChannelSplitterNodeOutput + j, j);
                    }
                    outputChannelSplitterNodeOutput += outputChannelCount[i];
                }
                return outputGainNode;
            }
            if (!nativeAudioWorkletNodeIsOwnedByContext) {
                for (const [nm, audioParam] of proxy.parameters.entries()) {
                    await renderAutomation(nativeOfflineAudioContext, audioParam, 
                    // @todo The definition that TypeScript uses of the AudioParamMap is lacking many methods.
                    nativeAudioWorkletNode.parameters.get(nm));
                }
            }
            else {
                for (const [nm, audioParam] of proxy.parameters.entries()) {
                    await connectAudioParam(nativeOfflineAudioContext, audioParam, 
                    // @todo The definition that TypeScript uses of the AudioParamMap is lacking many methods.
                    nativeAudioWorkletNode.parameters.get(nm));
                }
            }
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioWorkletNode);
            return nativeAudioWorkletNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                deleteUnrenderedAudioWorkletNode(nativeOfflineAudioContext, proxy);
                const renderedNativeAudioWorkletNodeOrGainNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);
                if (renderedNativeAudioWorkletNodeOrGainNode !== undefined) {
                    return Promise.resolve(renderedNativeAudioWorkletNodeOrGainNode);
                }
                return createAudioNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const createBaseAudioContextConstructor = (addAudioWorkletModule, analyserNodeConstructor, audioBufferConstructor, audioBufferSourceNodeConstructor, biquadFilterNodeConstructor, channelMergerNodeConstructor, channelSplitterNodeConstructor, constantSourceNodeConstructor, convolverNodeConstructor, decodeAudioData, delayNodeConstructor, dynamicsCompressorNodeConstructor, gainNodeConstructor, iIRFilterNodeConstructor, minimalBaseAudioContextConstructor, oscillatorNodeConstructor, pannerNodeConstructor, periodicWaveConstructor, stereoPannerNodeConstructor, waveShaperNodeConstructor) => {
    return class BaseAudioContext extends minimalBaseAudioContextConstructor {
        constructor(_nativeContext, numberOfChannels) {
            super(_nativeContext, numberOfChannels);
            this._nativeContext = _nativeContext;
            this._audioWorklet =
                addAudioWorkletModule === undefined
                    ? undefined
                    : {
                        addModule: (moduleURL, options) => {
                            return addAudioWorkletModule(this, moduleURL, options);
                        }
                    };
        }
        get audioWorklet() {
            return this._audioWorklet;
        }
        createAnalyser() {
            return new analyserNodeConstructor(this);
        }
        createBiquadFilter() {
            return new biquadFilterNodeConstructor(this);
        }
        createBuffer(numberOfChannels, length, sampleRate) {
            return new audioBufferConstructor({ length, numberOfChannels, sampleRate });
        }
        createBufferSource() {
            return new audioBufferSourceNodeConstructor(this);
        }
        createChannelMerger(numberOfInputs = 6) {
            return new channelMergerNodeConstructor(this, { numberOfInputs });
        }
        createChannelSplitter(numberOfOutputs = 6) {
            return new channelSplitterNodeConstructor(this, { numberOfOutputs });
        }
        createConstantSource() {
            return new constantSourceNodeConstructor(this);
        }
        createConvolver() {
            return new convolverNodeConstructor(this);
        }
        createDelay(maxDelayTime = 1) {
            return new delayNodeConstructor(this, { maxDelayTime });
        }
        createDynamicsCompressor() {
            return new dynamicsCompressorNodeConstructor(this);
        }
        createGain() {
            return new gainNodeConstructor(this);
        }
        createIIRFilter(feedforward, feedback) {
            return new iIRFilterNodeConstructor(this, { feedback, feedforward });
        }
        createOscillator() {
            return new oscillatorNodeConstructor(this);
        }
        createPanner() {
            return new pannerNodeConstructor(this);
        }
        createPeriodicWave(real, imag, constraints = { disableNormalization: false }) {
            return new periodicWaveConstructor(this, { ...constraints, imag, real });
        }
        createStereoPanner() {
            return new stereoPannerNodeConstructor(this);
        }
        createWaveShaper() {
            return new waveShaperNodeConstructor(this);
        }
        decodeAudioData(audioData, successCallback, errorCallback) {
            return decodeAudioData(this._nativeContext, audioData).then((audioBuffer) => {
                if (typeof successCallback === 'function') {
                    successCallback(audioBuffer);
                }
                return audioBuffer;
            }, (err) => {
                if (typeof errorCallback === 'function') {
                    errorCallback(err);
                }
                throw err;
            });
        }
    };
};

const DEFAULT_OPTIONS$4 = {
    Q: 1,
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    detune: 0,
    frequency: 350,
    gain: 0,
    type: 'lowpass'
};
const createBiquadFilterNodeConstructor = (audioNodeConstructor, createAudioParam, createBiquadFilterNodeRenderer, createInvalidAccessError, createNativeBiquadFilterNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) => {
    return class BiquadFilterNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$4, ...options };
            const nativeBiquadFilterNode = createNativeBiquadFilterNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const biquadFilterNodeRenderer = (isOffline ? createBiquadFilterNodeRenderer() : null);
            super(context, false, nativeBiquadFilterNode, biquadFilterNodeRenderer);
            // Bug #80: Safari does not export the correct values for maxValue and minValue.
            this._Q = createAudioParam(this, isOffline, nativeBiquadFilterNode.Q, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
            // Bug #78: Firefox & Safari do not export the correct values for maxValue and minValue.
            this._detune = createAudioParam(this, isOffline, nativeBiquadFilterNode.detune, 1200 * Math.log2(MOST_POSITIVE_SINGLE_FLOAT), -1200 * Math.log2(MOST_POSITIVE_SINGLE_FLOAT));
            // Bug #77: Firefox & Safari do not export the correct value for minValue.
            this._frequency = createAudioParam(this, isOffline, nativeBiquadFilterNode.frequency, context.sampleRate / 2, 0);
            // Bug #79: Firefox & Safari do not export the correct values for maxValue and minValue.
            this._gain = createAudioParam(this, isOffline, nativeBiquadFilterNode.gain, 40 * Math.log10(MOST_POSITIVE_SINGLE_FLOAT), MOST_NEGATIVE_SINGLE_FLOAT);
            this._nativeBiquadFilterNode = nativeBiquadFilterNode;
            // @todo Determine a meaningful tail-time instead of just using one second.
            setAudioNodeTailTime(this, 1);
        }
        get detune() {
            return this._detune;
        }
        get frequency() {
            return this._frequency;
        }
        get gain() {
            return this._gain;
        }
        get Q() {
            return this._Q;
        }
        get type() {
            return this._nativeBiquadFilterNode.type;
        }
        set type(value) {
            this._nativeBiquadFilterNode.type = value;
        }
        getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
            // Bug #189: Safari does throw an InvalidStateError.
            try {
                this._nativeBiquadFilterNode.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
            }
            catch (err) {
                if (err.code === 11) {
                    throw createInvalidAccessError();
                }
                throw err;
            }
            // Bug #68: Safari does not throw an error if the parameters differ in their length.
            if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) {
                throw createInvalidAccessError();
            }
        }
    };
};

const createBiquadFilterNodeRendererFactory = (connectAudioParam, createNativeBiquadFilterNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeBiquadFilterNodes = new WeakMap();
        const createBiquadFilterNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeBiquadFilterNode = getNativeAudioNode(proxy);
            /*
             * If the initially used nativeBiquadFilterNode was not constructed on the same OfflineAudioContext it needs to be created
             * again.
             */
            const nativeBiquadFilterNodeIsOwnedByContext = isOwnedByContext(nativeBiquadFilterNode, nativeOfflineAudioContext);
            if (!nativeBiquadFilterNodeIsOwnedByContext) {
                const options = {
                    Q: nativeBiquadFilterNode.Q.value,
                    channelCount: nativeBiquadFilterNode.channelCount,
                    channelCountMode: nativeBiquadFilterNode.channelCountMode,
                    channelInterpretation: nativeBiquadFilterNode.channelInterpretation,
                    detune: nativeBiquadFilterNode.detune.value,
                    frequency: nativeBiquadFilterNode.frequency.value,
                    gain: nativeBiquadFilterNode.gain.value,
                    type: nativeBiquadFilterNode.type
                };
                nativeBiquadFilterNode = createNativeBiquadFilterNode(nativeOfflineAudioContext, options);
            }
            renderedNativeBiquadFilterNodes.set(nativeOfflineAudioContext, nativeBiquadFilterNode);
            if (!nativeBiquadFilterNodeIsOwnedByContext) {
                await renderAutomation(nativeOfflineAudioContext, proxy.Q, nativeBiquadFilterNode.Q);
                await renderAutomation(nativeOfflineAudioContext, proxy.detune, nativeBiquadFilterNode.detune);
                await renderAutomation(nativeOfflineAudioContext, proxy.frequency, nativeBiquadFilterNode.frequency);
                await renderAutomation(nativeOfflineAudioContext, proxy.gain, nativeBiquadFilterNode.gain);
            }
            else {
                await connectAudioParam(nativeOfflineAudioContext, proxy.Q, nativeBiquadFilterNode.Q);
                await connectAudioParam(nativeOfflineAudioContext, proxy.detune, nativeBiquadFilterNode.detune);
                await connectAudioParam(nativeOfflineAudioContext, proxy.frequency, nativeBiquadFilterNode.frequency);
                await connectAudioParam(nativeOfflineAudioContext, proxy.gain, nativeBiquadFilterNode.gain);
            }
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeBiquadFilterNode);
            return nativeBiquadFilterNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeBiquadFilterNode = renderedNativeBiquadFilterNodes.get(nativeOfflineAudioContext);
                if (renderedNativeBiquadFilterNode !== undefined) {
                    return Promise.resolve(renderedNativeBiquadFilterNode);
                }
                return createBiquadFilterNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const createCacheTestResult = (ongoingTests, testResults) => {
    return (tester, test) => {
        const cachedTestResult = testResults.get(tester);
        if (cachedTestResult !== undefined) {
            return cachedTestResult;
        }
        const ongoingTest = ongoingTests.get(tester);
        if (ongoingTest !== undefined) {
            return ongoingTest;
        }
        try {
            const synchronousTestResult = test();
            if (synchronousTestResult instanceof Promise) {
                ongoingTests.set(tester, synchronousTestResult);
                return synchronousTestResult
                    .catch(() => false)
                    .then((finalTestResult) => {
                    ongoingTests.delete(tester);
                    testResults.set(tester, finalTestResult);
                    return finalTestResult;
                });
            }
            testResults.set(tester, synchronousTestResult);
            return synchronousTestResult;
        }
        catch {
            testResults.set(tester, false);
            return false;
        }
    };
};

const DEFAULT_OPTIONS$5 = {
    channelCount: 1,
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
    numberOfInputs: 6
};
const createChannelMergerNodeConstructor = (audioNodeConstructor, createChannelMergerNodeRenderer, createNativeChannelMergerNode, getNativeContext, isNativeOfflineAudioContext) => {
    return class ChannelMergerNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$5, ...options };
            const nativeChannelMergerNode = createNativeChannelMergerNode(nativeContext, mergedOptions);
            const channelMergerNodeRenderer = ((isNativeOfflineAudioContext(nativeContext) ? createChannelMergerNodeRenderer() : null));
            super(context, false, nativeChannelMergerNode, channelMergerNodeRenderer);
        }
    };
};

const createChannelMergerNodeRendererFactory = (createNativeChannelMergerNode, getNativeAudioNode, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeAudioNodes = new WeakMap();
        const createAudioNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeAudioNode = getNativeAudioNode(proxy);
            // If the initially used nativeAudioNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativeAudioNodeIsOwnedByContext = isOwnedByContext(nativeAudioNode, nativeOfflineAudioContext);
            if (!nativeAudioNodeIsOwnedByContext) {
                const options = {
                    channelCount: nativeAudioNode.channelCount,
                    channelCountMode: nativeAudioNode.channelCountMode,
                    channelInterpretation: nativeAudioNode.channelInterpretation,
                    numberOfInputs: nativeAudioNode.numberOfInputs
                };
                nativeAudioNode = createNativeChannelMergerNode(nativeOfflineAudioContext, options);
            }
            renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeAudioNode);
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioNode);
            return nativeAudioNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeAudioNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);
                if (renderedNativeAudioNode !== undefined) {
                    return Promise.resolve(renderedNativeAudioNode);
                }
                return createAudioNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const DEFAULT_OPTIONS$6 = {
    channelCount: 6,
    channelCountMode: 'explicit',
    channelInterpretation: 'discrete',
    numberOfOutputs: 6
};
const createChannelSplitterNodeConstructor = (audioNodeConstructor, createChannelSplitterNodeRenderer, createNativeChannelSplitterNode, getNativeContext, isNativeOfflineAudioContext, sanitizeChannelSplitterOptions) => {
    return class ChannelSplitterNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = sanitizeChannelSplitterOptions({ ...DEFAULT_OPTIONS$6, ...options });
            const nativeChannelSplitterNode = createNativeChannelSplitterNode(nativeContext, mergedOptions);
            const channelSplitterNodeRenderer = ((isNativeOfflineAudioContext(nativeContext) ? createChannelSplitterNodeRenderer() : null));
            super(context, false, nativeChannelSplitterNode, channelSplitterNodeRenderer);
        }
    };
};

const createChannelSplitterNodeRendererFactory = (createNativeChannelSplitterNode, getNativeAudioNode, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeAudioNodes = new WeakMap();
        const createAudioNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeAudioNode = getNativeAudioNode(proxy);
            // If the initially used nativeAudioNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativeAudioNodeIsOwnedByContext = isOwnedByContext(nativeAudioNode, nativeOfflineAudioContext);
            if (!nativeAudioNodeIsOwnedByContext) {
                const options = {
                    channelCount: nativeAudioNode.channelCount,
                    channelCountMode: nativeAudioNode.channelCountMode,
                    channelInterpretation: nativeAudioNode.channelInterpretation,
                    numberOfOutputs: nativeAudioNode.numberOfOutputs
                };
                nativeAudioNode = createNativeChannelSplitterNode(nativeOfflineAudioContext, options);
            }
            renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeAudioNode);
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioNode);
            return nativeAudioNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeAudioNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);
                if (renderedNativeAudioNode !== undefined) {
                    return Promise.resolve(renderedNativeAudioNode);
                }
                return createAudioNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const createConnectAudioParam = (renderInputsOfAudioParam) => {
    return (nativeOfflineAudioContext, audioParam, nativeAudioParam) => {
        return renderInputsOfAudioParam(audioParam, nativeOfflineAudioContext, nativeAudioParam);
    };
};

const createConnectMultipleOutputs = (createIndexSizeError) => {
    return (outputAudioNodes, destination, output = 0, input = 0) => {
        const outputAudioNode = outputAudioNodes[output];
        if (outputAudioNode === undefined) {
            throw createIndexSizeError();
        }
        if (isNativeAudioNode(destination)) {
            return outputAudioNode.connect(destination, 0, input);
        }
        return outputAudioNode.connect(destination, 0);
    };
};

const createConnectedNativeAudioBufferSourceNodeFactory = (createNativeAudioBufferSourceNode) => {
    return (nativeContext, nativeAudioNode) => {
        const nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode(nativeContext, {
            buffer: null,
            channelCount: 2,
            channelCountMode: 'max',
            channelInterpretation: 'speakers',
            loop: false,
            loopEnd: 0,
            loopStart: 0,
            playbackRate: 1
        });
        const nativeAudioBuffer = nativeContext.createBuffer(1, 2, 44100);
        nativeAudioBufferSourceNode.buffer = nativeAudioBuffer;
        nativeAudioBufferSourceNode.loop = true;
        nativeAudioBufferSourceNode.connect(nativeAudioNode);
        nativeAudioBufferSourceNode.start();
        return () => {
            nativeAudioBufferSourceNode.stop();
            nativeAudioBufferSourceNode.disconnect(nativeAudioNode);
        };
    };
};

const DEFAULT_OPTIONS$7 = {
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    offset: 1
};
const createConstantSourceNodeConstructor = (audioNodeConstructor, createAudioParam, createConstantSourceNodeRendererFactory, createNativeConstantSourceNode, getNativeContext, isNativeOfflineAudioContext, wrapEventListener) => {
    return class ConstantSourceNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$7, ...options };
            const nativeConstantSourceNode = createNativeConstantSourceNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const constantSourceNodeRenderer = ((isOffline ? createConstantSourceNodeRendererFactory() : null));
            super(context, false, nativeConstantSourceNode, constantSourceNodeRenderer);
            this._constantSourceNodeRenderer = constantSourceNodeRenderer;
            this._nativeConstantSourceNode = nativeConstantSourceNode;
            /*
             * Bug #62 & #74: Safari does not support ConstantSourceNodes and does not export the correct values for maxValue and minValue
             * for GainNodes.
             */
            this._offset = createAudioParam(this, isOffline, nativeConstantSourceNode.offset, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
            this._onended = null;
        }
        get offset() {
            return this._offset;
        }
        get onended() {
            return this._onended;
        }
        set onended(value) {
            const wrappedListener = typeof value === 'function' ? wrapEventListener(this, value) : null;
            this._nativeConstantSourceNode.onended = wrappedListener;
            const nativeOnEnded = this._nativeConstantSourceNode.onended;
            this._onended = nativeOnEnded !== null && nativeOnEnded === wrappedListener ? value : nativeOnEnded;
        }
        start(when = 0) {
            this._nativeConstantSourceNode.start(when);
            if (this._constantSourceNodeRenderer !== null) {
                this._constantSourceNodeRenderer.start = when;
            }
            if (this.context.state !== 'closed') {
                setInternalStateToActive(this);
                const resetInternalStateToPassive = () => {
                    this._nativeConstantSourceNode.removeEventListener('ended', resetInternalStateToPassive);
                    if (isActiveAudioNode(this)) {
                        setInternalStateToPassive(this);
                    }
                };
                this._nativeConstantSourceNode.addEventListener('ended', resetInternalStateToPassive);
            }
        }
        stop(when = 0) {
            this._nativeConstantSourceNode.stop(when);
            if (this._constantSourceNodeRenderer !== null) {
                this._constantSourceNodeRenderer.stop = when;
            }
        }
    };
};

const createConstantSourceNodeRendererFactory = (connectAudioParam, createNativeConstantSourceNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeConstantSourceNodes = new WeakMap();
        let start = null;
        let stop = null;
        const createConstantSourceNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeConstantSourceNode = getNativeAudioNode(proxy);
            /*
             * If the initially used nativeConstantSourceNode was not constructed on the same OfflineAudioContext it needs to be created
             * again.
             */
            const nativeConstantSourceNodeIsOwnedByContext = isOwnedByContext(nativeConstantSourceNode, nativeOfflineAudioContext);
            if (!nativeConstantSourceNodeIsOwnedByContext) {
                const options = {
                    channelCount: nativeConstantSourceNode.channelCount,
                    channelCountMode: nativeConstantSourceNode.channelCountMode,
                    channelInterpretation: nativeConstantSourceNode.channelInterpretation,
                    offset: nativeConstantSourceNode.offset.value
                };
                nativeConstantSourceNode = createNativeConstantSourceNode(nativeOfflineAudioContext, options);
                if (start !== null) {
                    nativeConstantSourceNode.start(start);
                }
                if (stop !== null) {
                    nativeConstantSourceNode.stop(stop);
                }
            }
            renderedNativeConstantSourceNodes.set(nativeOfflineAudioContext, nativeConstantSourceNode);
            if (!nativeConstantSourceNodeIsOwnedByContext) {
                await renderAutomation(nativeOfflineAudioContext, proxy.offset, nativeConstantSourceNode.offset);
            }
            else {
                await connectAudioParam(nativeOfflineAudioContext, proxy.offset, nativeConstantSourceNode.offset);
            }
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeConstantSourceNode);
            return nativeConstantSourceNode;
        };
        return {
            set start(value) {
                start = value;
            },
            set stop(value) {
                stop = value;
            },
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeConstantSourceNode = renderedNativeConstantSourceNodes.get(nativeOfflineAudioContext);
                if (renderedNativeConstantSourceNode !== undefined) {
                    return Promise.resolve(renderedNativeConstantSourceNode);
                }
                return createConstantSourceNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const createConvertNumberToUnsignedLong = (unit32Array) => {
    return (value) => {
        unit32Array[0] = value;
        return unit32Array[0];
    };
};

const DEFAULT_OPTIONS$8 = {
    buffer: null,
    channelCount: 2,
    channelCountMode: 'clamped-max',
    channelInterpretation: 'speakers',
    disableNormalization: false
};
const createConvolverNodeConstructor = (audioNodeConstructor, createConvolverNodeRenderer, createNativeConvolverNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) => {
    return class ConvolverNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$8, ...options };
            const nativeConvolverNode = createNativeConvolverNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const convolverNodeRenderer = (isOffline ? createConvolverNodeRenderer() : null);
            super(context, false, nativeConvolverNode, convolverNodeRenderer);
            this._isBufferNullified = false;
            this._nativeConvolverNode = nativeConvolverNode;
            if (mergedOptions.buffer !== null) {
                setAudioNodeTailTime(this, mergedOptions.buffer.duration);
            }
        }
        get buffer() {
            if (this._isBufferNullified) {
                return null;
            }
            return this._nativeConvolverNode.buffer;
        }
        set buffer(value) {
            this._nativeConvolverNode.buffer = value;
            // Bug #115: Safari does not allow to set the buffer to null.
            if (value === null && this._nativeConvolverNode.buffer !== null) {
                const nativeContext = this._nativeConvolverNode.context;
                this._nativeConvolverNode.buffer = nativeContext.createBuffer(1, 1, 44100);
                this._isBufferNullified = true;
                setAudioNodeTailTime(this, 0);
            }
            else {
                this._isBufferNullified = false;
                setAudioNodeTailTime(this, this._nativeConvolverNode.buffer === null ? 0 : this._nativeConvolverNode.buffer.duration);
            }
        }
        get normalize() {
            return this._nativeConvolverNode.normalize;
        }
        set normalize(value) {
            this._nativeConvolverNode.normalize = value;
        }
    };
};

const createConvolverNodeRendererFactory = (createNativeConvolverNode, getNativeAudioNode, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeConvolverNodes = new WeakMap();
        const createConvolverNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeConvolverNode = getNativeAudioNode(proxy);
            // If the initially used nativeConvolverNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativeConvolverNodeIsOwnedByContext = isOwnedByContext(nativeConvolverNode, nativeOfflineAudioContext);
            if (!nativeConvolverNodeIsOwnedByContext) {
                const options = {
                    buffer: nativeConvolverNode.buffer,
                    channelCount: nativeConvolverNode.channelCount,
                    channelCountMode: nativeConvolverNode.channelCountMode,
                    channelInterpretation: nativeConvolverNode.channelInterpretation,
                    disableNormalization: !nativeConvolverNode.normalize
                };
                nativeConvolverNode = createNativeConvolverNode(nativeOfflineAudioContext, options);
            }
            renderedNativeConvolverNodes.set(nativeOfflineAudioContext, nativeConvolverNode);
            if (isNativeAudioNodeFaker(nativeConvolverNode)) {
                await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeConvolverNode.inputs[0]);
            }
            else {
                await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeConvolverNode);
            }
            return nativeConvolverNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeConvolverNode = renderedNativeConvolverNodes.get(nativeOfflineAudioContext);
                if (renderedNativeConvolverNode !== undefined) {
                    return Promise.resolve(renderedNativeConvolverNode);
                }
                return createConvolverNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const createCreateNativeOfflineAudioContext = (createNotSupportedError, nativeOfflineAudioContextConstructor) => {
    return (numberOfChannels, length, sampleRate) => {
        if (nativeOfflineAudioContextConstructor === null) {
            throw new Error('Missing the native OfflineAudioContext constructor.');
        }
        try {
            return new nativeOfflineAudioContextConstructor(numberOfChannels, length, sampleRate);
        }
        catch (err) {
            // Bug #143, #144 & #146: Safari throws a SyntaxError when numberOfChannels, length or sampleRate are invalid.
            if (err.name === 'SyntaxError') {
                throw createNotSupportedError();
            }
            throw err;
        }
    };
};

const createDataCloneError = () => new DOMException('', 'DataCloneError');

const detachArrayBuffer = (arrayBuffer) => {
    const { port1, port2 } = new MessageChannel();
    return new Promise((resolve) => {
        const closeAndResolve = () => {
            port2.onmessage = null;
            port1.close();
            port2.close();
            resolve();
        };
        port2.onmessage = () => closeAndResolve();
        try {
            port1.postMessage(arrayBuffer, [arrayBuffer]);
        }
        finally {
            closeAndResolve();
        }
    });
};

const createDecodeAudioData = (audioBufferStore, cacheTestResult, createDataCloneError, createEncodingError, detachedArrayBuffers, getNativeContext, isNativeContext, testAudioBufferCopyChannelMethodsOutOfBoundsSupport, testPromiseSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds) => {
    return (anyContext, audioData) => {
        const nativeContext = isNativeContext(anyContext) ? anyContext : getNativeContext(anyContext);
        // Bug #43: Only Chrome, Edge and Opera do throw a DataCloneError.
        if (detachedArrayBuffers.has(audioData)) {
            const err = createDataCloneError();
            return Promise.reject(err);
        }
        // The audioData parameter maybe of a type which can't be added to a WeakSet.
        try {
            detachedArrayBuffers.add(audioData);
        }
        catch {
            // Ignore errors.
        }
        // Bug #21: Safari does not support promises yet.
        if (cacheTestResult(testPromiseSupport, () => testPromiseSupport(nativeContext))) {
            return nativeContext.decodeAudioData(audioData).then((audioBuffer) => {
                // Bug #133: Safari does neuter the ArrayBuffer.
                detachArrayBuffer(audioData).catch(() => {
                    // Ignore errors.
                });
                // Bug #157: Firefox does not allow the bufferOffset to be out-of-bounds.
                if (!cacheTestResult(testAudioBufferCopyChannelMethodsOutOfBoundsSupport, () => testAudioBufferCopyChannelMethodsOutOfBoundsSupport(audioBuffer))) {
                    wrapAudioBufferCopyChannelMethodsOutOfBounds(audioBuffer);
                }
                audioBufferStore.add(audioBuffer);
                return audioBuffer;
            });
        }
        // Bug #21: Safari does not return a Promise yet.
        return new Promise((resolve, reject) => {
            const complete = async () => {
                // Bug #133: Safari does neuter the ArrayBuffer.
                try {
                    await detachArrayBuffer(audioData);
                }
                catch {
                    // Ignore errors.
                }
            };
            const fail = (err) => {
                reject(err);
                complete();
            };
            // Bug #26: Safari throws a synchronous error.
            try {
                // Bug #1: Safari requires a successCallback.
                nativeContext.decodeAudioData(audioData, (audioBuffer) => {
                    // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
                    // Bug #100: Safari does throw a wrong error when calling getChannelData() with an out-of-bounds value.
                    if (typeof audioBuffer.copyFromChannel !== 'function') {
                        wrapAudioBufferCopyChannelMethods(audioBuffer);
                        wrapAudioBufferGetChannelDataMethod(audioBuffer);
                    }
                    audioBufferStore.add(audioBuffer);
                    complete().then(() => resolve(audioBuffer));
                }, (err) => {
                    // Bug #4: Safari returns null instead of an error.
                    if (err === null) {
                        fail(createEncodingError());
                    }
                    else {
                        fail(err);
                    }
                });
            }
            catch (err) {
                fail(err);
            }
        });
    };
};

const createDecrementCycleCounter = (connectNativeAudioNodeToNativeAudioNode, cycleCounters, getAudioNodeConnections, getNativeAudioNode, getNativeAudioParam, getNativeContext, isActiveAudioNode, isNativeOfflineAudioContext) => {
    return (audioNode, count) => {
        const cycleCounter = cycleCounters.get(audioNode);
        if (cycleCounter === undefined) {
            throw new Error('Missing the expected cycle count.');
        }
        const nativeContext = getNativeContext(audioNode.context);
        const isOffline = isNativeOfflineAudioContext(nativeContext);
        if (cycleCounter === count) {
            cycleCounters.delete(audioNode);
            if (!isOffline && isActiveAudioNode(audioNode)) {
                const nativeSourceAudioNode = getNativeAudioNode(audioNode);
                const { outputs } = getAudioNodeConnections(audioNode);
                for (const output of outputs) {
                    if (isAudioNodeOutputConnection(output)) {
                        const nativeDestinationAudioNode = getNativeAudioNode(output[0]);
                        connectNativeAudioNodeToNativeAudioNode(nativeSourceAudioNode, nativeDestinationAudioNode, output[1], output[2]);
                    }
                    else {
                        const nativeDestinationAudioParam = getNativeAudioParam(output[0]);
                        nativeSourceAudioNode.connect(nativeDestinationAudioParam, output[1]);
                    }
                }
            }
        }
        else {
            cycleCounters.set(audioNode, cycleCounter - count);
        }
    };
};

const DEFAULT_OPTIONS$9 = {
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    delayTime: 0,
    maxDelayTime: 1
};
const createDelayNodeConstructor = (audioNodeConstructor, createAudioParam, createDelayNodeRenderer, createNativeDelayNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) => {
    return class DelayNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$9, ...options };
            const nativeDelayNode = createNativeDelayNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const delayNodeRenderer = (isOffline ? createDelayNodeRenderer(mergedOptions.maxDelayTime) : null);
            super(context, false, nativeDelayNode, delayNodeRenderer);
            this._delayTime = createAudioParam(this, isOffline, nativeDelayNode.delayTime);
            setAudioNodeTailTime(this, mergedOptions.maxDelayTime);
        }
        get delayTime() {
            return this._delayTime;
        }
    };
};

const createDelayNodeRendererFactory = (connectAudioParam, createNativeDelayNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) => {
    return (maxDelayTime) => {
        const renderedNativeDelayNodes = new WeakMap();
        const createDelayNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeDelayNode = getNativeAudioNode(proxy);
            // If the initially used nativeDelayNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativeDelayNodeIsOwnedByContext = isOwnedByContext(nativeDelayNode, nativeOfflineAudioContext);
            if (!nativeDelayNodeIsOwnedByContext) {
                const options = {
                    channelCount: nativeDelayNode.channelCount,
                    channelCountMode: nativeDelayNode.channelCountMode,
                    channelInterpretation: nativeDelayNode.channelInterpretation,
                    delayTime: nativeDelayNode.delayTime.value,
                    maxDelayTime
                };
                nativeDelayNode = createNativeDelayNode(nativeOfflineAudioContext, options);
            }
            renderedNativeDelayNodes.set(nativeOfflineAudioContext, nativeDelayNode);
            if (!nativeDelayNodeIsOwnedByContext) {
                await renderAutomation(nativeOfflineAudioContext, proxy.delayTime, nativeDelayNode.delayTime);
            }
            else {
                await connectAudioParam(nativeOfflineAudioContext, proxy.delayTime, nativeDelayNode.delayTime);
            }
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeDelayNode);
            return nativeDelayNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeDelayNode = renderedNativeDelayNodes.get(nativeOfflineAudioContext);
                if (renderedNativeDelayNode !== undefined) {
                    return Promise.resolve(renderedNativeDelayNode);
                }
                return createDelayNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const createDeleteActiveInputConnectionToAudioNode = (pickElementFromSet) => {
    return (activeInputs, source, output, input) => {
        return pickElementFromSet(activeInputs[input], (activeInputConnection) => activeInputConnection[0] === source && activeInputConnection[1] === output);
    };
};

const createDeleteUnrenderedAudioWorkletNode = (getUnrenderedAudioWorkletNodes) => {
    return (nativeContext, audioWorkletNode) => {
        getUnrenderedAudioWorkletNodes(nativeContext).delete(audioWorkletNode);
    };
};

const isDelayNode = (audioNode) => {
    return 'delayTime' in audioNode;
};

const createDetectCycles = (audioParamAudioNodeStore, getAudioNodeConnections, getValueForKey) => {
    return function detectCycles(chain, nextLink) {
        const audioNode = isAudioNode(nextLink) ? nextLink : getValueForKey(audioParamAudioNodeStore, nextLink);
        if (isDelayNode(audioNode)) {
            return [];
        }
        if (chain[0] === audioNode) {
            return [chain];
        }
        if (chain.includes(audioNode)) {
            return [];
        }
        const { outputs } = getAudioNodeConnections(audioNode);
        return Array.from(outputs)
            .map((outputConnection) => detectCycles([...chain, audioNode], outputConnection[0]))
            .reduce((mergedCycles, nestedCycles) => mergedCycles.concat(nestedCycles), []);
    };
};

const getOutputAudioNodeAtIndex = (createIndexSizeError, outputAudioNodes, output) => {
    const outputAudioNode = outputAudioNodes[output];
    if (outputAudioNode === undefined) {
        throw createIndexSizeError();
    }
    return outputAudioNode;
};
const createDisconnectMultipleOutputs = (createIndexSizeError) => {
    return (outputAudioNodes, destinationOrOutput = undefined, output = undefined, input = 0) => {
        if (destinationOrOutput === undefined) {
            return outputAudioNodes.forEach((outputAudioNode) => outputAudioNode.disconnect());
        }
        if (typeof destinationOrOutput === 'number') {
            return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, destinationOrOutput).disconnect();
        }
        if (isNativeAudioNode(destinationOrOutput)) {
            if (output === undefined) {
                return outputAudioNodes.forEach((outputAudioNode) => outputAudioNode.disconnect(destinationOrOutput));
            }
            if (input === undefined) {
                return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, output).disconnect(destinationOrOutput, 0);
            }
            return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, output).disconnect(destinationOrOutput, 0, input);
        }
        if (output === undefined) {
            return outputAudioNodes.forEach((outputAudioNode) => outputAudioNode.disconnect(destinationOrOutput));
        }
        return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, output).disconnect(destinationOrOutput, 0);
    };
};

const DEFAULT_OPTIONS$a = {
    attack: 0.003,
    channelCount: 2,
    channelCountMode: 'clamped-max',
    channelInterpretation: 'speakers',
    knee: 30,
    ratio: 12,
    release: 0.25,
    threshold: -24
};
const createDynamicsCompressorNodeConstructor = (audioNodeConstructor, createAudioParam, createDynamicsCompressorNodeRenderer, createNativeDynamicsCompressorNode, createNotSupportedError, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) => {
    return class DynamicsCompressorNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$a, ...options };
            const nativeDynamicsCompressorNode = createNativeDynamicsCompressorNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const dynamicsCompressorNodeRenderer = (isOffline ? createDynamicsCompressorNodeRenderer() : null);
            super(context, false, nativeDynamicsCompressorNode, dynamicsCompressorNodeRenderer);
            this._attack = createAudioParam(this, isOffline, nativeDynamicsCompressorNode.attack);
            this._knee = createAudioParam(this, isOffline, nativeDynamicsCompressorNode.knee);
            this._nativeDynamicsCompressorNode = nativeDynamicsCompressorNode;
            this._ratio = createAudioParam(this, isOffline, nativeDynamicsCompressorNode.ratio);
            this._release = createAudioParam(this, isOffline, nativeDynamicsCompressorNode.release);
            this._threshold = createAudioParam(this, isOffline, nativeDynamicsCompressorNode.threshold);
            setAudioNodeTailTime(this, 0.006);
        }
        get attack() {
            return this._attack;
        }
        // Bug #108: Safari allows a channelCount of three and above which is why the getter and setter needs to be overwritten here.
        get channelCount() {
            return this._nativeDynamicsCompressorNode.channelCount;
        }
        set channelCount(value) {
            const previousChannelCount = this._nativeDynamicsCompressorNode.channelCount;
            this._nativeDynamicsCompressorNode.channelCount = value;
            if (value > 2) {
                this._nativeDynamicsCompressorNode.channelCount = previousChannelCount;
                throw createNotSupportedError();
            }
        }
        /*
         * Bug #109: Only Chrome, Firefox and Opera disallow a channelCountMode of 'max' yet which is why the getter and setter needs to be
         * overwritten here.
         */
        get channelCountMode() {
            return this._nativeDynamicsCompressorNode.channelCountMode;
        }
        set channelCountMode(value) {
            const previousChannelCount = this._nativeDynamicsCompressorNode.channelCountMode;
            this._nativeDynamicsCompressorNode.channelCountMode = value;
            if (value === 'max') {
                this._nativeDynamicsCompressorNode.channelCountMode = previousChannelCount;
                throw createNotSupportedError();
            }
        }
        get knee() {
            return this._knee;
        }
        get ratio() {
            return this._ratio;
        }
        get reduction() {
            // Bug #111: Safari returns an AudioParam instead of a number.
            if (typeof this._nativeDynamicsCompressorNode.reduction.value === 'number') {
                return this._nativeDynamicsCompressorNode.reduction.value;
            }
            return this._nativeDynamicsCompressorNode.reduction;
        }
        get release() {
            return this._release;
        }
        get threshold() {
            return this._threshold;
        }
    };
};

const createDynamicsCompressorNodeRendererFactory = (connectAudioParam, createNativeDynamicsCompressorNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeDynamicsCompressorNodes = new WeakMap();
        const createDynamicsCompressorNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeDynamicsCompressorNode = getNativeAudioNode(proxy);
            /*
             * If the initially used nativeDynamicsCompressorNode was not constructed on the same OfflineAudioContext it needs to be
             * created again.
             */
            const nativeDynamicsCompressorNodeIsOwnedByContext = isOwnedByContext(nativeDynamicsCompressorNode, nativeOfflineAudioContext);
            if (!nativeDynamicsCompressorNodeIsOwnedByContext) {
                const options = {
                    attack: nativeDynamicsCompressorNode.attack.value,
                    channelCount: nativeDynamicsCompressorNode.channelCount,
                    channelCountMode: nativeDynamicsCompressorNode.channelCountMode,
                    channelInterpretation: nativeDynamicsCompressorNode.channelInterpretation,
                    knee: nativeDynamicsCompressorNode.knee.value,
                    ratio: nativeDynamicsCompressorNode.ratio.value,
                    release: nativeDynamicsCompressorNode.release.value,
                    threshold: nativeDynamicsCompressorNode.threshold.value
                };
                nativeDynamicsCompressorNode = createNativeDynamicsCompressorNode(nativeOfflineAudioContext, options);
            }
            renderedNativeDynamicsCompressorNodes.set(nativeOfflineAudioContext, nativeDynamicsCompressorNode);
            if (!nativeDynamicsCompressorNodeIsOwnedByContext) {
                await renderAutomation(nativeOfflineAudioContext, proxy.attack, nativeDynamicsCompressorNode.attack);
                await renderAutomation(nativeOfflineAudioContext, proxy.knee, nativeDynamicsCompressorNode.knee);
                await renderAutomation(nativeOfflineAudioContext, proxy.ratio, nativeDynamicsCompressorNode.ratio);
                await renderAutomation(nativeOfflineAudioContext, proxy.release, nativeDynamicsCompressorNode.release);
                await renderAutomation(nativeOfflineAudioContext, proxy.threshold, nativeDynamicsCompressorNode.threshold);
            }
            else {
                await connectAudioParam(nativeOfflineAudioContext, proxy.attack, nativeDynamicsCompressorNode.attack);
                await connectAudioParam(nativeOfflineAudioContext, proxy.knee, nativeDynamicsCompressorNode.knee);
                await connectAudioParam(nativeOfflineAudioContext, proxy.ratio, nativeDynamicsCompressorNode.ratio);
                await connectAudioParam(nativeOfflineAudioContext, proxy.release, nativeDynamicsCompressorNode.release);
                await connectAudioParam(nativeOfflineAudioContext, proxy.threshold, nativeDynamicsCompressorNode.threshold);
            }
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeDynamicsCompressorNode);
            return nativeDynamicsCompressorNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeDynamicsCompressorNode = renderedNativeDynamicsCompressorNodes.get(nativeOfflineAudioContext);
                if (renderedNativeDynamicsCompressorNode !== undefined) {
                    return Promise.resolve(renderedNativeDynamicsCompressorNode);
                }
                return createDynamicsCompressorNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const createEncodingError = () => new DOMException('', 'EncodingError');

const createEvaluateSource = (window) => {
    return (source) => new Promise((resolve, reject) => {
        if (window === null) {
            // Bug #182 Chrome, Edge and Opera do throw an instance of a SyntaxError instead of a DOMException.
            reject(new SyntaxError());
            return;
        }
        const head = window.document.head;
        if (head === null) {
            // Bug #182 Chrome, Edge and Opera do throw an instance of a SyntaxError instead of a DOMException.
            reject(new SyntaxError());
        }
        else {
            const script = window.document.createElement('script');
            // @todo Safari doesn't like URLs with a type of 'application/javascript; charset=utf-8'.
            const blob = new Blob([source], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const originalOnErrorHandler = window.onerror;
            const removeErrorEventListenerAndRevokeUrl = () => {
                window.onerror = originalOnErrorHandler;
                URL.revokeObjectURL(url);
            };
            window.onerror = (message, src, lineno, colno, error) => {
                // @todo Edge thinks the source is the one of the html document.
                if (src === url || (src === window.location.href && lineno === 1 && colno === 1)) {
                    removeErrorEventListenerAndRevokeUrl();
                    reject(error);
                    return false;
                }
                if (originalOnErrorHandler !== null) {
                    return originalOnErrorHandler(message, src, lineno, colno, error);
                }
            };
            script.onerror = () => {
                removeErrorEventListenerAndRevokeUrl();
                // Bug #182 Chrome, Edge and Opera do throw an instance of a SyntaxError instead of a DOMException.
                reject(new SyntaxError());
            };
            script.onload = () => {
                removeErrorEventListenerAndRevokeUrl();
                resolve();
            };
            script.src = url;
            script.type = 'module';
            head.appendChild(script);
        }
    });
};

const createEventTargetConstructor = (wrapEventListener) => {
    return class EventTarget {
        constructor(_nativeEventTarget) {
            this._nativeEventTarget = _nativeEventTarget;
            this._listeners = new WeakMap();
        }
        addEventListener(type, listener, options) {
            if (listener !== null) {
                let wrappedEventListener = this._listeners.get(listener);
                if (wrappedEventListener === undefined) {
                    wrappedEventListener = wrapEventListener(this, listener);
                    if (typeof listener === 'function') {
                        this._listeners.set(listener, wrappedEventListener);
                    }
                }
                this._nativeEventTarget.addEventListener(type, wrappedEventListener, options);
            }
        }
        dispatchEvent(event) {
            return this._nativeEventTarget.dispatchEvent(event);
        }
        removeEventListener(type, listener, options) {
            const wrappedEventListener = listener === null ? undefined : this._listeners.get(listener);
            this._nativeEventTarget.removeEventListener(type, wrappedEventListener === undefined ? null : wrappedEventListener, options);
        }
    };
};

const createExposeCurrentFrameAndCurrentTime = (window) => {
    return (currentTime, sampleRate, fn) => {
        Object.defineProperties(window, {
            currentFrame: {
                configurable: true,
                get() {
                    return Math.round(currentTime * sampleRate);
                }
            },
            currentTime: {
                configurable: true,
                get() {
                    return currentTime;
                }
            }
        });
        try {
            return fn();
        }
        finally {
            if (window !== null) {
                delete window.currentFrame;
                delete window.currentTime;
            }
        }
    };
};

const createFetchSource = (createAbortError) => {
    return async (url) => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return [await response.text(), response.url];
            }
        }
        catch {
            // Ignore errors.
        } // tslint:disable-line:no-empty
        throw createAbortError();
    };
};

const DEFAULT_OPTIONS$b = {
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    gain: 1
};
const createGainNodeConstructor = (audioNodeConstructor, createAudioParam, createGainNodeRenderer, createNativeGainNode, getNativeContext, isNativeOfflineAudioContext) => {
    return class GainNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$b, ...options };
            const nativeGainNode = createNativeGainNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const gainNodeRenderer = (isOffline ? createGainNodeRenderer() : null);
            super(context, false, nativeGainNode, gainNodeRenderer);
            // Bug #74: Safari does not export the correct values for maxValue and minValue.
            this._gain = createAudioParam(this, isOffline, nativeGainNode.gain, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
        }
        get gain() {
            return this._gain;
        }
    };
};

const createGainNodeRendererFactory = (connectAudioParam, createNativeGainNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeGainNodes = new WeakMap();
        const createGainNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeGainNode = getNativeAudioNode(proxy);
            // If the initially used nativeGainNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativeGainNodeIsOwnedByContext = isOwnedByContext(nativeGainNode, nativeOfflineAudioContext);
            if (!nativeGainNodeIsOwnedByContext) {
                const options = {
                    channelCount: nativeGainNode.channelCount,
                    channelCountMode: nativeGainNode.channelCountMode,
                    channelInterpretation: nativeGainNode.channelInterpretation,
                    gain: nativeGainNode.gain.value
                };
                nativeGainNode = createNativeGainNode(nativeOfflineAudioContext, options);
            }
            renderedNativeGainNodes.set(nativeOfflineAudioContext, nativeGainNode);
            if (!nativeGainNodeIsOwnedByContext) {
                await renderAutomation(nativeOfflineAudioContext, proxy.gain, nativeGainNode.gain);
            }
            else {
                await connectAudioParam(nativeOfflineAudioContext, proxy.gain, nativeGainNode.gain);
            }
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeGainNode);
            return nativeGainNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeGainNode = renderedNativeGainNodes.get(nativeOfflineAudioContext);
                if (renderedNativeGainNode !== undefined) {
                    return Promise.resolve(renderedNativeGainNode);
                }
                return createGainNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const createGetActiveAudioWorkletNodeInputs = (activeAudioWorkletNodeInputsStore, getValueForKey) => {
    return (nativeAudioWorkletNode) => getValueForKey(activeAudioWorkletNodeInputsStore, nativeAudioWorkletNode);
};

const createGetAudioNodeRenderer = (getAudioNodeConnections) => {
    return (audioNode) => {
        const audioNodeConnections = getAudioNodeConnections(audioNode);
        if (audioNodeConnections.renderer === null) {
            throw new Error('Missing the renderer of the given AudioNode in the audio graph.');
        }
        return audioNodeConnections.renderer;
    };
};

const createGetAudioNodeTailTime = (audioNodeTailTimeStore) => {
    return (audioNode) => { var _a; return (_a = audioNodeTailTimeStore.get(audioNode)) !== null && _a !== void 0 ? _a : 0; };
};

const createGetAudioParamRenderer = (getAudioParamConnections) => {
    return (audioParam) => {
        const audioParamConnections = getAudioParamConnections(audioParam);
        if (audioParamConnections.renderer === null) {
            throw new Error('Missing the renderer of the given AudioParam in the audio graph.');
        }
        return audioParamConnections.renderer;
    };
};

const createGetBackupOfflineAudioContext = (backupOfflineAudioContextStore) => {
    return (nativeContext) => {
        return backupOfflineAudioContextStore.get(nativeContext);
    };
};

const createInvalidStateError = () => new DOMException('', 'InvalidStateError');

const createGetNativeContext = (contextStore) => {
    return (context) => {
        const nativeContext = contextStore.get(context);
        if (nativeContext === undefined) {
            throw createInvalidStateError();
        }
        return (nativeContext);
    };
};

const createGetOrCreateBackupOfflineAudioContext = (backupOfflineAudioContextStore, nativeOfflineAudioContextConstructor) => {
    return (nativeContext) => {
        let backupOfflineAudioContext = backupOfflineAudioContextStore.get(nativeContext);
        if (backupOfflineAudioContext !== undefined) {
            return backupOfflineAudioContext;
        }
        if (nativeOfflineAudioContextConstructor === null) {
            throw new Error('Missing the native OfflineAudioContext constructor.');
        }
        // Bug #141: Safari does not support creating an OfflineAudioContext with less than 44100 Hz.
        backupOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        backupOfflineAudioContextStore.set(nativeContext, backupOfflineAudioContext);
        return backupOfflineAudioContext;
    };
};

const createGetUnrenderedAudioWorkletNodes = (unrenderedAudioWorkletNodeStore) => {
    return (nativeContext) => {
        const unrenderedAudioWorkletNodes = unrenderedAudioWorkletNodeStore.get(nativeContext);
        if (unrenderedAudioWorkletNodes === undefined) {
            throw new Error('The context has no set of AudioWorkletNodes.');
        }
        return unrenderedAudioWorkletNodes;
    };
};

const createInvalidAccessError = () => new DOMException('', 'InvalidAccessError');

const wrapIIRFilterNodeGetFrequencyResponseMethod = (nativeIIRFilterNode) => {
    nativeIIRFilterNode.getFrequencyResponse = ((getFrequencyResponse) => {
        return (frequencyHz, magResponse, phaseResponse) => {
            if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) {
                throw createInvalidAccessError();
            }
            return getFrequencyResponse.call(nativeIIRFilterNode, frequencyHz, magResponse, phaseResponse);
        };
    })(nativeIIRFilterNode.getFrequencyResponse);
};

const DEFAULT_OPTIONS$c = {
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers'
};
const createIIRFilterNodeConstructor = (audioNodeConstructor, createNativeIIRFilterNode, createIIRFilterNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) => {
    return class IIRFilterNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const mergedOptions = { ...DEFAULT_OPTIONS$c, ...options };
            const nativeIIRFilterNode = createNativeIIRFilterNode(nativeContext, isOffline ? null : context.baseLatency, mergedOptions);
            const iirFilterNodeRenderer = ((isOffline ? createIIRFilterNodeRenderer(mergedOptions.feedback, mergedOptions.feedforward) : null));
            super(context, false, nativeIIRFilterNode, iirFilterNodeRenderer);
            // Bug #23 & #24: FirefoxDeveloper does not throw an InvalidAccessError.
            // @todo Write a test which allows other browsers to remain unpatched.
            wrapIIRFilterNodeGetFrequencyResponseMethod(nativeIIRFilterNode);
            this._nativeIIRFilterNode = nativeIIRFilterNode;
            // @todo Determine a meaningful tail-time instead of just using one second.
            setAudioNodeTailTime(this, 1);
        }
        getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
            return this._nativeIIRFilterNode.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
        }
    };
};

// This implementation as shamelessly inspired by source code of
// tslint:disable-next-line:max-line-length
// {@link https://chromium.googlesource.com/chromium/src.git/+/master/third_party/WebKit/Source/platform/audio/IIRFilter.cpp|Chromium's IIRFilter}.
const filterBuffer = (feedback, feedbackLength, feedforward, feedforwardLength, minLength, xBuffer, yBuffer, bufferIndex, bufferLength, input, output) => {
    const inputLength = input.length;
    let i = bufferIndex;
    for (let j = 0; j < inputLength; j += 1) {
        let y = feedforward[0] * input[j];
        for (let k = 1; k < minLength; k += 1) {
            const x = (i - k) & (bufferLength - 1); // tslint:disable-line:no-bitwise
            y += feedforward[k] * xBuffer[x];
            y -= feedback[k] * yBuffer[x];
        }
        for (let k = minLength; k < feedforwardLength; k += 1) {
            y += feedforward[k] * xBuffer[(i - k) & (bufferLength - 1)]; // tslint:disable-line:no-bitwise
        }
        for (let k = minLength; k < feedbackLength; k += 1) {
            y -= feedback[k] * yBuffer[(i - k) & (bufferLength - 1)]; // tslint:disable-line:no-bitwise
        }
        xBuffer[i] = input[j];
        yBuffer[i] = y;
        i = (i + 1) & (bufferLength - 1); // tslint:disable-line:no-bitwise
        output[j] = y;
    }
    return i;
};

const filterFullBuffer = (renderedBuffer, nativeOfflineAudioContext, feedback, feedforward) => {
    const convertedFeedback = feedback instanceof Float64Array ? feedback : new Float64Array(feedback);
    const convertedFeedforward = feedforward instanceof Float64Array ? feedforward : new Float64Array(feedforward);
    const feedbackLength = convertedFeedback.length;
    const feedforwardLength = convertedFeedforward.length;
    const minLength = Math.min(feedbackLength, feedforwardLength);
    if (convertedFeedback[0] !== 1) {
        for (let i = 0; i < feedbackLength; i += 1) {
            convertedFeedforward[i] /= convertedFeedback[0];
        }
        for (let i = 1; i < feedforwardLength; i += 1) {
            convertedFeedback[i] /= convertedFeedback[0];
        }
    }
    const bufferLength = 32;
    const xBuffer = new Float32Array(bufferLength);
    const yBuffer = new Float32Array(bufferLength);
    const filteredBuffer = nativeOfflineAudioContext.createBuffer(renderedBuffer.numberOfChannels, renderedBuffer.length, renderedBuffer.sampleRate);
    const numberOfChannels = renderedBuffer.numberOfChannels;
    for (let i = 0; i < numberOfChannels; i += 1) {
        const input = renderedBuffer.getChannelData(i);
        const output = filteredBuffer.getChannelData(i);
        xBuffer.fill(0);
        yBuffer.fill(0);
        filterBuffer(convertedFeedback, feedbackLength, convertedFeedforward, feedforwardLength, minLength, xBuffer, yBuffer, 0, bufferLength, input, output);
    }
    return filteredBuffer;
};
const createIIRFilterNodeRendererFactory = (createNativeAudioBufferSourceNode, getNativeAudioNode, nativeOfflineAudioContextConstructor, renderInputsOfAudioNode, renderNativeOfflineAudioContext) => {
    return (feedback, feedforward) => {
        const renderedNativeAudioNodes = new WeakMap();
        let filteredBufferPromise = null;
        const createAudioNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeAudioBufferSourceNode = null;
            let nativeIIRFilterNode = getNativeAudioNode(proxy);
            // If the initially used nativeIIRFilterNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativeIIRFilterNodeIsOwnedByContext = isOwnedByContext(nativeIIRFilterNode, nativeOfflineAudioContext);
            // Bug #9: Safari does not support IIRFilterNodes.
            if (nativeOfflineAudioContext.createIIRFilter === undefined) {
                nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode(nativeOfflineAudioContext, {
                    buffer: null,
                    channelCount: 2,
                    channelCountMode: 'max',
                    channelInterpretation: 'speakers',
                    loop: false,
                    loopEnd: 0,
                    loopStart: 0,
                    playbackRate: 1
                });
            }
            else if (!nativeIIRFilterNodeIsOwnedByContext) {
                // @todo TypeScript defines the parameters of createIIRFilter() as arrays of numbers.
                nativeIIRFilterNode = nativeOfflineAudioContext.createIIRFilter(feedforward, feedback);
            }
            renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeAudioBufferSourceNode === null ? nativeIIRFilterNode : nativeAudioBufferSourceNode);
            if (nativeAudioBufferSourceNode !== null) {
                if (filteredBufferPromise === null) {
                    if (nativeOfflineAudioContextConstructor === null) {
                        throw new Error('Missing the native OfflineAudioContext constructor.');
                    }
                    const partialOfflineAudioContext = new nativeOfflineAudioContextConstructor(
                    // Bug #47: The AudioDestinationNode in Safari gets not initialized correctly.
                    proxy.context.destination.channelCount, 
                    // Bug #17: Safari does not yet expose the length.
                    proxy.context.length, nativeOfflineAudioContext.sampleRate);
                    filteredBufferPromise = (async () => {
                        await renderInputsOfAudioNode(proxy, partialOfflineAudioContext, partialOfflineAudioContext.destination);
                        const renderedBuffer = await renderNativeOfflineAudioContext(partialOfflineAudioContext);
                        return filterFullBuffer(renderedBuffer, nativeOfflineAudioContext, feedback, feedforward);
                    })();
                }
                const filteredBuffer = await filteredBufferPromise;
                nativeAudioBufferSourceNode.buffer = filteredBuffer;
                nativeAudioBufferSourceNode.start(0);
                return nativeAudioBufferSourceNode;
            }
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeIIRFilterNode);
            return nativeIIRFilterNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeAudioNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);
                if (renderedNativeAudioNode !== undefined) {
                    return Promise.resolve(renderedNativeAudioNode);
                }
                return createAudioNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const createIncrementCycleCounterFactory = (cycleCounters, disconnectNativeAudioNodeFromNativeAudioNode, getAudioNodeConnections, getNativeAudioNode, getNativeAudioParam, isActiveAudioNode) => {
    return (isOffline) => {
        return (audioNode, count) => {
            const cycleCounter = cycleCounters.get(audioNode);
            if (cycleCounter === undefined) {
                if (!isOffline && isActiveAudioNode(audioNode)) {
                    const nativeSourceAudioNode = getNativeAudioNode(audioNode);
                    const { outputs } = getAudioNodeConnections(audioNode);
                    for (const output of outputs) {
                        if (isAudioNodeOutputConnection(output)) {
                            const nativeDestinationAudioNode = getNativeAudioNode(output[0]);
                            disconnectNativeAudioNodeFromNativeAudioNode(nativeSourceAudioNode, nativeDestinationAudioNode, output[1], output[2]);
                        }
                        else {
                            const nativeDestinationAudioParam = getNativeAudioParam(output[0]);
                            nativeSourceAudioNode.disconnect(nativeDestinationAudioParam, output[1]);
                        }
                    }
                }
                cycleCounters.set(audioNode, count);
            }
            else {
                cycleCounters.set(audioNode, cycleCounter + count);
            }
        };
    };
};

const createIsAnyAudioContext = (contextStore, isNativeAudioContext) => {
    return (anything) => {
        const nativeContext = contextStore.get(anything);
        return isNativeAudioContext(nativeContext) || isNativeAudioContext(anything);
    };
};

const createIsAnyAudioNode = (audioNodeStore, isNativeAudioNode) => {
    return (anything) => audioNodeStore.has(anything) || isNativeAudioNode(anything);
};

const createIsAnyAudioParam = (audioParamStore, isNativeAudioParam) => {
    return (anything) => audioParamStore.has(anything) || isNativeAudioParam(anything);
};

const createIsAnyOfflineAudioContext = (contextStore, isNativeOfflineAudioContext) => {
    return (anything) => {
        const nativeContext = contextStore.get(anything);
        return isNativeOfflineAudioContext(nativeContext) || isNativeOfflineAudioContext(anything);
    };
};

const createIsNativeAudioContext = (nativeAudioContextConstructor) => {
    return (anything) => {
        return nativeAudioContextConstructor !== null && anything instanceof nativeAudioContextConstructor;
    };
};

const createIsNativeAudioNode = (window) => {
    return (anything) => {
        return window !== null && typeof window.AudioNode === 'function' && anything instanceof window.AudioNode;
    };
};

const createIsNativeAudioParam = (window) => {
    return (anything) => {
        return window !== null && typeof window.AudioParam === 'function' && anything instanceof window.AudioParam;
    };
};

const createIsNativeContext = (isNativeAudioContext, isNativeOfflineAudioContext) => {
    return (anything) => {
        return isNativeAudioContext(anything) || isNativeOfflineAudioContext(anything);
    };
};

const createIsNativeOfflineAudioContext = (nativeOfflineAudioContextConstructor) => {
    return (anything) => {
        return nativeOfflineAudioContextConstructor !== null && anything instanceof nativeOfflineAudioContextConstructor;
    };
};

const createIsSecureContext = (window) => window !== null && window.isSecureContext;

const createIsSupportedPromise = async (cacheTestResult, testAudioBufferCopyChannelMethodsSubarraySupport, testAudioContextCloseMethodSupport, testAudioContextDecodeAudioDataMethodTypeErrorSupport, testAudioContextOptionsSupport, testAudioNodeConnectMethodSupport, testAudioWorkletProcessorNoOutputsSupport, testChannelMergerNodeChannelCountSupport, testConstantSourceNodeAccurateSchedulingSupport, testConvolverNodeBufferReassignabilitySupport, testConvolverNodeChannelCountSupport, testDomExceptionContrucorSupport, testIsSecureContextSupport, testMediaStreamAudioSourceNodeMediaStreamWithoutAudioTrackSupport, testStereoPannerNodeDefaultValueSupport, testTransferablesSupport) => {
    if (cacheTestResult(testAudioBufferCopyChannelMethodsSubarraySupport, testAudioBufferCopyChannelMethodsSubarraySupport) &&
        cacheTestResult(testAudioContextCloseMethodSupport, testAudioContextCloseMethodSupport) &&
        cacheTestResult(testAudioContextOptionsSupport, testAudioContextOptionsSupport) &&
        cacheTestResult(testAudioNodeConnectMethodSupport, testAudioNodeConnectMethodSupport) &&
        cacheTestResult(testChannelMergerNodeChannelCountSupport, testChannelMergerNodeChannelCountSupport) &&
        cacheTestResult(testConstantSourceNodeAccurateSchedulingSupport, testConstantSourceNodeAccurateSchedulingSupport) &&
        cacheTestResult(testConvolverNodeBufferReassignabilitySupport, testConvolverNodeBufferReassignabilitySupport) &&
        cacheTestResult(testConvolverNodeChannelCountSupport, testConvolverNodeChannelCountSupport) &&
        cacheTestResult(testDomExceptionContrucorSupport, testDomExceptionContrucorSupport) &&
        cacheTestResult(testIsSecureContextSupport, testIsSecureContextSupport) &&
        cacheTestResult(testMediaStreamAudioSourceNodeMediaStreamWithoutAudioTrackSupport, testMediaStreamAudioSourceNodeMediaStreamWithoutAudioTrackSupport)) {
        const results = await Promise.all([
            cacheTestResult(testAudioContextDecodeAudioDataMethodTypeErrorSupport, testAudioContextDecodeAudioDataMethodTypeErrorSupport),
            cacheTestResult(testAudioWorkletProcessorNoOutputsSupport, testAudioWorkletProcessorNoOutputsSupport),
            cacheTestResult(testStereoPannerNodeDefaultValueSupport, testStereoPannerNodeDefaultValueSupport),
            cacheTestResult(testTransferablesSupport, testTransferablesSupport)
        ]);
        return results.every((result) => result);
    }
    return false;
};

const createMediaElementAudioSourceNodeConstructor = (audioNodeConstructor, createNativeMediaElementAudioSourceNode, getNativeContext, isNativeOfflineAudioContext) => {
    return class MediaElementAudioSourceNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const nativeMediaElementAudioSourceNode = createNativeMediaElementAudioSourceNode(nativeContext, options);
            // Bug #171: Safari allows to create a MediaElementAudioSourceNode with an OfflineAudioContext.
            if (isNativeOfflineAudioContext(nativeContext)) {
                throw TypeError();
            }
            super(context, true, nativeMediaElementAudioSourceNode, null);
            this._nativeMediaElementAudioSourceNode = nativeMediaElementAudioSourceNode;
        }
        get mediaElement() {
            return this._nativeMediaElementAudioSourceNode.mediaElement;
        }
    };
};

const DEFAULT_OPTIONS$d = {
    channelCount: 2,
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers'
};
const createMediaStreamAudioDestinationNodeConstructor = (audioNodeConstructor, createNativeMediaStreamAudioDestinationNode, getNativeContext, isNativeOfflineAudioContext) => {
    return class MediaStreamAudioDestinationNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            // Bug #173: Safari allows to create a MediaStreamAudioDestinationNode with an OfflineAudioContext.
            if (isNativeOfflineAudioContext(nativeContext)) {
                throw new TypeError();
            }
            const mergedOptions = { ...DEFAULT_OPTIONS$d, ...options };
            const nativeMediaStreamAudioDestinationNode = createNativeMediaStreamAudioDestinationNode(nativeContext, mergedOptions);
            super(context, false, nativeMediaStreamAudioDestinationNode, null);
            this._nativeMediaStreamAudioDestinationNode = nativeMediaStreamAudioDestinationNode;
        }
        get stream() {
            return this._nativeMediaStreamAudioDestinationNode.stream;
        }
    };
};

const createMediaStreamAudioSourceNodeConstructor = (audioNodeConstructor, createNativeMediaStreamAudioSourceNode, getNativeContext, isNativeOfflineAudioContext) => {
    return class MediaStreamAudioSourceNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const nativeMediaStreamAudioSourceNode = createNativeMediaStreamAudioSourceNode(nativeContext, options);
            // Bug #172: Safari allows to create a MediaStreamAudioSourceNode with an OfflineAudioContext.
            if (isNativeOfflineAudioContext(nativeContext)) {
                throw new TypeError();
            }
            super(context, true, nativeMediaStreamAudioSourceNode, null);
            this._nativeMediaStreamAudioSourceNode = nativeMediaStreamAudioSourceNode;
        }
        get mediaStream() {
            return this._nativeMediaStreamAudioSourceNode.mediaStream;
        }
    };
};

const createMediaStreamTrackAudioSourceNodeConstructor = (audioNodeConstructor, createNativeMediaStreamTrackAudioSourceNode, getNativeContext) => {
    return class MediaStreamTrackAudioSourceNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const nativeMediaStreamTrackAudioSourceNode = createNativeMediaStreamTrackAudioSourceNode(nativeContext, options);
            super(context, true, nativeMediaStreamTrackAudioSourceNode, null);
        }
    };
};

const createMinimalBaseAudioContextConstructor = (audioDestinationNodeConstructor, createAudioListener, eventTargetConstructor, isNativeOfflineAudioContext, unrenderedAudioWorkletNodeStore, wrapEventListener) => {
    return class MinimalBaseAudioContext extends eventTargetConstructor {
        constructor(_nativeContext, numberOfChannels) {
            super(_nativeContext);
            this._nativeContext = _nativeContext;
            CONTEXT_STORE.set(this, _nativeContext);
            if (isNativeOfflineAudioContext(_nativeContext)) {
                unrenderedAudioWorkletNodeStore.set(_nativeContext, new Set());
            }
            this._destination = new audioDestinationNodeConstructor(this, numberOfChannels);
            this._listener = createAudioListener(this, _nativeContext);
            this._onstatechange = null;
        }
        get currentTime() {
            return this._nativeContext.currentTime;
        }
        get destination() {
            return this._destination;
        }
        get listener() {
            return this._listener;
        }
        get onstatechange() {
            return this._onstatechange;
        }
        set onstatechange(value) {
            const wrappedListener = typeof value === 'function' ? wrapEventListener(this, value) : null;
            this._nativeContext.onstatechange = wrappedListener;
            const nativeOnStateChange = this._nativeContext.onstatechange;
            this._onstatechange = nativeOnStateChange !== null && nativeOnStateChange === wrappedListener ? value : nativeOnStateChange;
        }
        get sampleRate() {
            return this._nativeContext.sampleRate;
        }
        get state() {
            return this._nativeContext.state;
        }
    };
};

const testPromiseSupport = (nativeContext) => {
    // This 12 numbers represent the 48 bytes of an empty WAVE file with a single sample.
    const uint32Array = new Uint32Array([1179011410, 40, 1163280727, 544501094, 16, 131073, 44100, 176400, 1048580, 1635017060, 4, 0]);
    try {
        // Bug #1: Safari requires a successCallback.
        const promise = nativeContext.decodeAudioData(uint32Array.buffer, () => {
            // Ignore the success callback.
        });
        if (promise === undefined) {
            return false;
        }
        promise.catch(() => {
            // Ignore rejected errors.
        });
        return true;
    }
    catch {
        // Ignore errors.
    }
    return false;
};

const createMonitorConnections = (insertElementInSet, isNativeAudioNode) => {
    return (nativeAudioNode, whenConnected, whenDisconnected) => {
        const connections = new Set();
        nativeAudioNode.connect = ((connect) => {
            // tslint:disable-next-line:invalid-void no-inferrable-types
            return (destination, output = 0, input = 0) => {
                const wasDisconnected = connections.size === 0;
                if (isNativeAudioNode(destination)) {
                    // @todo TypeScript cannot infer the overloaded signature with 3 arguments yet.
                    connect.call(nativeAudioNode, destination, output, input);
                    insertElementInSet(connections, [destination, output, input], (connection) => connection[0] === destination && connection[1] === output && connection[2] === input, true);
                    if (wasDisconnected) {
                        whenConnected();
                    }
                    return destination;
                }
                connect.call(nativeAudioNode, destination, output);
                insertElementInSet(connections, [destination, output], (connection) => connection[0] === destination && connection[1] === output, true);
                if (wasDisconnected) {
                    whenConnected();
                }
                return;
            };
        })(nativeAudioNode.connect);
        nativeAudioNode.disconnect = ((disconnect) => {
            return (destinationOrOutput, output, input) => {
                const wasConnected = connections.size > 0;
                if (destinationOrOutput === undefined) {
                    disconnect.apply(nativeAudioNode);
                    connections.clear();
                }
                else if (typeof destinationOrOutput === 'number') {
                    // @todo TypeScript cannot infer the overloaded signature with 1 argument yet.
                    disconnect.call(nativeAudioNode, destinationOrOutput);
                    for (const connection of connections) {
                        if (connection[1] === destinationOrOutput) {
                            connections.delete(connection);
                        }
                    }
                }
                else {
                    if (isNativeAudioNode(destinationOrOutput)) {
                        // @todo TypeScript cannot infer the overloaded signature with 3 arguments yet.
                        disconnect.call(nativeAudioNode, destinationOrOutput, output, input);
                    }
                    else {
                        // @todo TypeScript cannot infer the overloaded signature with 2 arguments yet.
                        disconnect.call(nativeAudioNode, destinationOrOutput, output);
                    }
                    for (const connection of connections) {
                        if (connection[0] === destinationOrOutput &&
                            (output === undefined || connection[1] === output) &&
                            (input === undefined || connection[2] === input)) {
                            connections.delete(connection);
                        }
                    }
                }
                const isDisconnected = connections.size === 0;
                if (wasConnected && isDisconnected) {
                    whenDisconnected();
                }
            };
        })(nativeAudioNode.disconnect);
        return nativeAudioNode;
    };
};

const assignNativeAudioNodeOption = (nativeAudioNode, options, option) => {
    const value = options[option];
    if (value !== undefined && value !== nativeAudioNode[option]) {
        nativeAudioNode[option] = value;
    }
};

const assignNativeAudioNodeOptions = (nativeAudioNode, options) => {
    assignNativeAudioNodeOption(nativeAudioNode, options, 'channelCount');
    assignNativeAudioNodeOption(nativeAudioNode, options, 'channelCountMode');
    assignNativeAudioNodeOption(nativeAudioNode, options, 'channelInterpretation');
};

const testAnalyserNodeGetFloatTimeDomainDataMethodSupport = (nativeAnalyserNode) => {
    return typeof nativeAnalyserNode.getFloatTimeDomainData === 'function';
};

const wrapAnalyserNodeGetFloatTimeDomainDataMethod = (nativeAnalyserNode) => {
    nativeAnalyserNode.getFloatTimeDomainData = (array) => {
        const byteTimeDomainData = new Uint8Array(array.length);
        nativeAnalyserNode.getByteTimeDomainData(byteTimeDomainData);
        const length = Math.max(byteTimeDomainData.length, nativeAnalyserNode.fftSize);
        for (let i = 0; i < length; i += 1) {
            array[i] = (byteTimeDomainData[i] - 128) * 0.0078125;
        }
        return array;
    };
};

const createNativeAnalyserNodeFactory = (cacheTestResult, createIndexSizeError) => {
    return (nativeContext, options) => {
        const nativeAnalyserNode = nativeContext.createAnalyser();
        // Bug #37: Firefox does not create an AnalyserNode with the default properties.
        assignNativeAudioNodeOptions(nativeAnalyserNode, options);
        // Bug #118: Safari does not throw an error if maxDecibels is not more than minDecibels.
        if (!(options.maxDecibels > options.minDecibels)) {
            throw createIndexSizeError();
        }
        assignNativeAudioNodeOption(nativeAnalyserNode, options, 'fftSize');
        assignNativeAudioNodeOption(nativeAnalyserNode, options, 'maxDecibels');
        assignNativeAudioNodeOption(nativeAnalyserNode, options, 'minDecibels');
        assignNativeAudioNodeOption(nativeAnalyserNode, options, 'smoothingTimeConstant');
        // Bug #36: Safari does not support getFloatTimeDomainData() yet.
        if (!cacheTestResult(testAnalyserNodeGetFloatTimeDomainDataMethodSupport, () => testAnalyserNodeGetFloatTimeDomainDataMethodSupport(nativeAnalyserNode))) {
            wrapAnalyserNodeGetFloatTimeDomainDataMethod(nativeAnalyserNode);
        }
        return nativeAnalyserNode;
    };
};

const createNativeAudioBufferConstructor = (window) => {
    if (window === null) {
        return null;
    }
    if (window.hasOwnProperty('AudioBuffer')) {
        return window.AudioBuffer;
    }
    return null;
};

const assignNativeAudioNodeAudioParamValue = (nativeAudioNode, options, audioParam) => {
    const value = options[audioParam];
    if (value !== undefined && value !== nativeAudioNode[audioParam].value) {
        nativeAudioNode[audioParam].value = value;
    }
};

const wrapAudioBufferSourceNodeStartMethodConsecutiveCalls = (nativeAudioBufferSourceNode) => {
    nativeAudioBufferSourceNode.start = ((start) => {
        let isScheduled = false;
        return (when = 0, offset = 0, duration) => {
            if (isScheduled) {
                throw createInvalidStateError();
            }
            start.call(nativeAudioBufferSourceNode, when, offset, duration);
            isScheduled = true;
        };
    })(nativeAudioBufferSourceNode.start);
};

const wrapAudioScheduledSourceNodeStartMethodNegativeParameters = (nativeAudioScheduledSourceNode) => {
    nativeAudioScheduledSourceNode.start = ((start) => {
        return (when = 0, offset = 0, duration) => {
            if ((typeof duration === 'number' && duration < 0) || offset < 0 || when < 0) {
                throw new RangeError("The parameters can't be negative.");
            }
            // @todo TypeScript cannot infer the overloaded signature with 3 arguments yet.
            start.call(nativeAudioScheduledSourceNode, when, offset, duration);
        };
    })(nativeAudioScheduledSourceNode.start);
};

const wrapAudioScheduledSourceNodeStopMethodNegativeParameters = (nativeAudioScheduledSourceNode) => {
    nativeAudioScheduledSourceNode.stop = ((stop) => {
        return (when = 0) => {
            if (when < 0) {
                throw new RangeError("The parameter can't be negative.");
            }
            stop.call(nativeAudioScheduledSourceNode, when);
        };
    })(nativeAudioScheduledSourceNode.stop);
};

const createNativeAudioBufferSourceNodeFactory = (addSilentConnection, cacheTestResult, testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport, testAudioBufferSourceNodeStartMethodOffsetClampingSupport, testAudioBufferSourceNodeStopMethodNullifiedBufferSupport, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioBufferSourceNodeStartMethodOffsetClampling, wrapAudioBufferSourceNodeStopMethodNullifiedBuffer, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls) => {
    return (nativeContext, options) => {
        const nativeAudioBufferSourceNode = nativeContext.createBufferSource();
        assignNativeAudioNodeOptions(nativeAudioBufferSourceNode, options);
        assignNativeAudioNodeAudioParamValue(nativeAudioBufferSourceNode, options, 'playbackRate');
        assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, 'buffer');
        // Bug #149: Safari does not yet support the detune AudioParam.
        assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, 'loop');
        assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, 'loopEnd');
        assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, 'loopStart');
        // Bug #69: Safari does allow calls to start() of an already scheduled AudioBufferSourceNode.
        if (!cacheTestResult(testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport, () => testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport(nativeContext))) {
            wrapAudioBufferSourceNodeStartMethodConsecutiveCalls(nativeAudioBufferSourceNode);
        }
        // Bug #154 & #155: Safari does not handle offsets which are equal to or greater than the duration of the buffer.
        if (!cacheTestResult(testAudioBufferSourceNodeStartMethodOffsetClampingSupport, () => testAudioBufferSourceNodeStartMethodOffsetClampingSupport(nativeContext))) {
            wrapAudioBufferSourceNodeStartMethodOffsetClampling(nativeAudioBufferSourceNode);
        }
        // Bug #162: Safari does throw an error when stop() is called on an AudioBufferSourceNode which has no buffer assigned to it.
        if (!cacheTestResult(testAudioBufferSourceNodeStopMethodNullifiedBufferSupport, () => testAudioBufferSourceNodeStopMethodNullifiedBufferSupport(nativeContext))) {
            wrapAudioBufferSourceNodeStopMethodNullifiedBuffer(nativeAudioBufferSourceNode, nativeContext);
        }
        // Bug #44: Safari does not throw a RangeError yet.
        if (!cacheTestResult(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, () => testAudioScheduledSourceNodeStartMethodNegativeParametersSupport(nativeContext))) {
            wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeAudioBufferSourceNode);
        }
        // Bug #19: Safari does not ignore calls to stop() of an already stopped AudioBufferSourceNode.
        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, () => testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport(nativeContext))) {
            wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls(nativeAudioBufferSourceNode, nativeContext);
        }
        // Bug #44: Only Firefox does not throw a RangeError yet.
        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, () => testAudioScheduledSourceNodeStopMethodNegativeParametersSupport(nativeContext))) {
            wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeAudioBufferSourceNode);
        }
        // Bug #175: Safari will not fire an ended event if the AudioBufferSourceNode is unconnected.
        addSilentConnection(nativeContext, nativeAudioBufferSourceNode);
        return nativeAudioBufferSourceNode;
    };
};

const createNativeAudioContextConstructor = (window) => {
    if (window === null) {
        return null;
    }
    if (window.hasOwnProperty('AudioContext')) {
        return window.AudioContext;
    }
    return window.hasOwnProperty('webkitAudioContext') ? window.webkitAudioContext : null;
};

const createNativeAudioDestinationNodeFactory = (createNativeGainNode, overwriteAccessors) => {
    return (nativeContext, channelCount, isNodeOfNativeOfflineAudioContext) => {
        const nativeAudioDestinationNode = nativeContext.destination;
        // Bug #132: Safari does not have the correct channelCount.
        if (nativeAudioDestinationNode.channelCount !== channelCount) {
            try {
                nativeAudioDestinationNode.channelCount = channelCount;
            }
            catch {
                // Bug #169: Safari throws an error on each attempt to change the channelCount.
            }
        }
        // Bug #83: Safari does not have the correct channelCountMode.
        if (isNodeOfNativeOfflineAudioContext && nativeAudioDestinationNode.channelCountMode !== 'explicit') {
            nativeAudioDestinationNode.channelCountMode = 'explicit';
        }
        // Bug #47: The AudioDestinationNode in Safari does not initialize the maxChannelCount property correctly.
        if (nativeAudioDestinationNode.maxChannelCount === 0) {
            Object.defineProperty(nativeAudioDestinationNode, 'maxChannelCount', {
                value: channelCount
            });
        }
        // Bug #168: No browser does yet have an AudioDestinationNode with an output.
        const gainNode = createNativeGainNode(nativeContext, {
            channelCount,
            channelCountMode: nativeAudioDestinationNode.channelCountMode,
            channelInterpretation: nativeAudioDestinationNode.channelInterpretation,
            gain: 1
        });
        overwriteAccessors(gainNode, 'channelCount', (get) => () => get.call(gainNode), (set) => (value) => {
            set.call(gainNode, value);
            try {
                nativeAudioDestinationNode.channelCount = value;
            }
            catch (err) {
                // Bug #169: Safari throws an error on each attempt to change the channelCount.
                if (value > nativeAudioDestinationNode.maxChannelCount) {
                    throw err;
                }
            }
        });
        overwriteAccessors(gainNode, 'channelCountMode', (get) => () => get.call(gainNode), (set) => (value) => {
            set.call(gainNode, value);
            nativeAudioDestinationNode.channelCountMode = value;
        });
        overwriteAccessors(gainNode, 'channelInterpretation', (get) => () => get.call(gainNode), (set) => (value) => {
            set.call(gainNode, value);
            nativeAudioDestinationNode.channelInterpretation = value;
        });
        Object.defineProperty(gainNode, 'maxChannelCount', {
            get: () => nativeAudioDestinationNode.maxChannelCount
        });
        // @todo This should be disconnected when the context is closed.
        gainNode.connect(nativeAudioDestinationNode);
        return gainNode;
    };
};

const createNativeAudioWorkletNodeConstructor = (window) => {
    if (window === null) {
        return null;
    }
    return window.hasOwnProperty('AudioWorkletNode') ? window.AudioWorkletNode : null;
};

const testClonabilityOfAudioWorkletNodeOptions = (audioWorkletNodeOptions) => {
    const { port1 } = new MessageChannel();
    try {
        // This will throw an error if the audioWorkletNodeOptions are not clonable.
        port1.postMessage(audioWorkletNodeOptions);
    }
    finally {
        port1.close();
    }
};

const createNativeAudioWorkletNodeFactory = (createInvalidStateError, createNativeAudioWorkletNodeFaker, createNativeGainNode, createNotSupportedError, monitorConnections) => {
    return (nativeContext, baseLatency, nativeAudioWorkletNodeConstructor, name, processorConstructor, options) => {
        if (nativeAudioWorkletNodeConstructor !== null) {
            try {
                const nativeAudioWorkletNode = new nativeAudioWorkletNodeConstructor(nativeContext, name, options);
                const patchedEventListeners = new Map();
                let onprocessorerror = null;
                Object.defineProperties(nativeAudioWorkletNode, {
                    /*
                     * Bug #61: Overwriting the property accessors for channelCount and channelCountMode is necessary as long as some
                     * browsers have no native implementation to achieve a consistent behavior.
                     */
                    channelCount: {
                        get: () => options.channelCount,
                        set: () => {
                            throw createInvalidStateError();
                        }
                    },
                    channelCountMode: {
                        get: () => 'explicit',
                        set: () => {
                            throw createInvalidStateError();
                        }
                    },
                    // Bug #156: Chrome and Edge do not yet fire an ErrorEvent.
                    onprocessorerror: {
                        get: () => onprocessorerror,
                        set: (value) => {
                            if (typeof onprocessorerror === 'function') {
                                nativeAudioWorkletNode.removeEventListener('processorerror', onprocessorerror);
                            }
                            onprocessorerror = typeof value === 'function' ? value : null;
                            if (typeof onprocessorerror === 'function') {
                                nativeAudioWorkletNode.addEventListener('processorerror', onprocessorerror);
                            }
                        }
                    }
                });
                nativeAudioWorkletNode.addEventListener = ((addEventListener) => {
                    return (...args) => {
                        if (args[0] === 'processorerror') {
                            const unpatchedEventListener = typeof args[1] === 'function'
                                ? args[1]
                                : typeof args[1] === 'object' && args[1] !== null && typeof args[1].handleEvent === 'function'
                                    ? args[1].handleEvent
                                    : null;
                            if (unpatchedEventListener !== null) {
                                const patchedEventListener = patchedEventListeners.get(args[1]);
                                if (patchedEventListener !== undefined) {
                                    args[1] = patchedEventListener;
                                }
                                else {
                                    args[1] = (event) => {
                                        // Bug #178: Chrome, Edge and Opera do fire an event of type error.
                                        if (event.type === 'error') {
                                            Object.defineProperties(event, {
                                                type: { value: 'processorerror' }
                                            });
                                            unpatchedEventListener(event);
                                        }
                                        else {
                                            unpatchedEventListener(new ErrorEvent(args[0], { ...event }));
                                        }
                                    };
                                    patchedEventListeners.set(unpatchedEventListener, args[1]);
                                }
                            }
                        }
                        // Bug #178: Chrome, Edge and Opera do fire an event of type error.
                        addEventListener.call(nativeAudioWorkletNode, 'error', args[1], args[2]);
                        return addEventListener.call(nativeAudioWorkletNode, ...args);
                    };
                })(nativeAudioWorkletNode.addEventListener);
                nativeAudioWorkletNode.removeEventListener = ((removeEventListener) => {
                    return (...args) => {
                        if (args[0] === 'processorerror') {
                            const patchedEventListener = patchedEventListeners.get(args[1]);
                            if (patchedEventListener !== undefined) {
                                patchedEventListeners.delete(args[1]);
                                args[1] = patchedEventListener;
                            }
                        }
                        // Bug #178: Chrome, Edge and Opera do fire an event of type error.
                        removeEventListener.call(nativeAudioWorkletNode, 'error', args[1], args[2]);
                        return removeEventListener.call(nativeAudioWorkletNode, args[0], args[1], args[2]);
                    };
                })(nativeAudioWorkletNode.removeEventListener);
                /*
                 * Bug #86: Chrome and Edge do not invoke the process() function if the corresponding AudioWorkletNode is unconnected but
                 * has an output.
                 */
                if (options.numberOfOutputs !== 0) {
                    const nativeGainNode = createNativeGainNode(nativeContext, {
                        channelCount: 1,
                        channelCountMode: 'explicit',
                        channelInterpretation: 'discrete',
                        gain: 0
                    });
                    nativeAudioWorkletNode.connect(nativeGainNode).connect(nativeContext.destination);
                    const whenConnected = () => nativeGainNode.disconnect();
                    const whenDisconnected = () => nativeGainNode.connect(nativeContext.destination);
                    // @todo Disconnect the connection when the process() function of the AudioWorkletNode returns false.
                    return monitorConnections(nativeAudioWorkletNode, whenConnected, whenDisconnected);
                }
                return nativeAudioWorkletNode;
            }
            catch (err) {
                // Bug #60: Chrome, Edge & Opera throw an InvalidStateError instead of a NotSupportedError.
                if (err.code === 11) {
                    throw createNotSupportedError();
                }
                throw err;
            }
        }
        // Bug #61: Only Chrome & Opera have an implementation of the AudioWorkletNode yet.
        if (processorConstructor === undefined) {
            throw createNotSupportedError();
        }
        testClonabilityOfAudioWorkletNodeOptions(options);
        return createNativeAudioWorkletNodeFaker(nativeContext, baseLatency, processorConstructor, options);
    };
};

const computeBufferSize = (baseLatency, sampleRate) => {
    if (baseLatency === null) {
        return 512;
    }
    return Math.max(512, Math.min(16384, Math.pow(2, Math.round(Math.log2(baseLatency * sampleRate)))));
};

const cloneAudioWorkletNodeOptions = (audioWorkletNodeOptions) => {
    return new Promise((resolve, reject) => {
        const { port1, port2 } = new MessageChannel();
        port1.onmessage = ({ data }) => {
            port1.close();
            port2.close();
            resolve(data);
        };
        port1.onmessageerror = ({ data }) => {
            port1.close();
            port2.close();
            reject(data);
        };
        // This will throw an error if the audioWorkletNodeOptions are not clonable.
        port2.postMessage(audioWorkletNodeOptions);
    });
};

const createAudioWorkletProcessorPromise = async (processorConstructor, audioWorkletNodeOptions) => {
    const clonedAudioWorkletNodeOptions = await cloneAudioWorkletNodeOptions(audioWorkletNodeOptions);
    return new processorConstructor(clonedAudioWorkletNodeOptions);
};

const createAudioWorkletProcessor = (nativeContext, nativeAudioWorkletNode, processorConstructor, audioWorkletNodeOptions) => {
    let nodeToProcessorMap = NODE_TO_PROCESSOR_MAPS.get(nativeContext);
    if (nodeToProcessorMap === undefined) {
        nodeToProcessorMap = new WeakMap();
        NODE_TO_PROCESSOR_MAPS.set(nativeContext, nodeToProcessorMap);
    }
    const audioWorkletProcessorPromise = createAudioWorkletProcessorPromise(processorConstructor, audioWorkletNodeOptions);
    nodeToProcessorMap.set(nativeAudioWorkletNode, audioWorkletProcessorPromise);
    return audioWorkletProcessorPromise;
};

const createNativeAudioWorkletNodeFakerFactory = (connectMultipleOutputs, createIndexSizeError, createInvalidStateError, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, createNativeScriptProcessorNode, createNotSupportedError, disconnectMultipleOutputs, exposeCurrentFrameAndCurrentTime, getActiveAudioWorkletNodeInputs, monitorConnections) => {
    return (nativeContext, baseLatency, processorConstructor, options) => {
        if (options.numberOfInputs === 0 && options.numberOfOutputs === 0) {
            throw createNotSupportedError();
        }
        const outputChannelCount = Array.isArray(options.outputChannelCount)
            ? options.outputChannelCount
            : Array.from(options.outputChannelCount);
        // @todo Check if any of the channelCount values is greater than the implementation's maximum number of channels.
        if (outputChannelCount.some((channelCount) => channelCount < 1)) {
            throw createNotSupportedError();
        }
        if (outputChannelCount.length !== options.numberOfOutputs) {
            throw createIndexSizeError();
        }
        // Bug #61: This is not part of the standard but required for the faker to work.
        if (options.channelCountMode !== 'explicit') {
            throw createNotSupportedError();
        }
        const numberOfInputChannels = options.channelCount * options.numberOfInputs;
        const numberOfOutputChannels = outputChannelCount.reduce((sum, value) => sum + value, 0);
        const numberOfParameters = processorConstructor.parameterDescriptors === undefined ? 0 : processorConstructor.parameterDescriptors.length;
        // Bug #61: This is not part of the standard but required for the faker to work.
        if (numberOfInputChannels + numberOfParameters > 6 || numberOfOutputChannels > 6) {
            throw createNotSupportedError();
        }
        const messageChannel = new MessageChannel();
        const gainNodes = [];
        const inputChannelSplitterNodes = [];
        for (let i = 0; i < options.numberOfInputs; i += 1) {
            gainNodes.push(createNativeGainNode(nativeContext, {
                channelCount: options.channelCount,
                channelCountMode: options.channelCountMode,
                channelInterpretation: options.channelInterpretation,
                gain: 1
            }));
            inputChannelSplitterNodes.push(createNativeChannelSplitterNode(nativeContext, {
                channelCount: options.channelCount,
                channelCountMode: 'explicit',
                channelInterpretation: 'discrete',
                numberOfOutputs: options.channelCount
            }));
        }
        const constantSourceNodes = [];
        if (processorConstructor.parameterDescriptors !== undefined) {
            for (const { defaultValue, maxValue, minValue, name } of processorConstructor.parameterDescriptors) {
                const constantSourceNode = createNativeConstantSourceNode(nativeContext, {
                    channelCount: 1,
                    channelCountMode: 'explicit',
                    channelInterpretation: 'discrete',
                    offset: options.parameterData[name] !== undefined
                        ? options.parameterData[name]
                        : defaultValue === undefined
                            ? 0
                            : defaultValue
                });
                Object.defineProperties(constantSourceNode.offset, {
                    defaultValue: {
                        get: () => (defaultValue === undefined ? 0 : defaultValue)
                    },
                    maxValue: {
                        get: () => (maxValue === undefined ? MOST_POSITIVE_SINGLE_FLOAT : maxValue)
                    },
                    minValue: {
                        get: () => (minValue === undefined ? MOST_NEGATIVE_SINGLE_FLOAT : minValue)
                    }
                });
                constantSourceNodes.push(constantSourceNode);
            }
        }
        const inputChannelMergerNode = createNativeChannelMergerNode(nativeContext, {
            channelCount: 1,
            channelCountMode: 'explicit',
            channelInterpretation: 'speakers',
            numberOfInputs: Math.max(1, numberOfInputChannels + numberOfParameters)
        });
        const bufferSize = computeBufferSize(baseLatency, nativeContext.sampleRate);
        const scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, bufferSize, numberOfInputChannels + numberOfParameters, 
        // Bug #87: Only Firefox will fire an AudioProcessingEvent if there is no connected output.
        Math.max(1, numberOfOutputChannels));
        const outputChannelSplitterNode = createNativeChannelSplitterNode(nativeContext, {
            channelCount: Math.max(1, numberOfOutputChannels),
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete',
            numberOfOutputs: Math.max(1, numberOfOutputChannels)
        });
        const outputChannelMergerNodes = [];
        for (let i = 0; i < options.numberOfOutputs; i += 1) {
            outputChannelMergerNodes.push(createNativeChannelMergerNode(nativeContext, {
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'speakers',
                numberOfInputs: outputChannelCount[i]
            }));
        }
        for (let i = 0; i < options.numberOfInputs; i += 1) {
            gainNodes[i].connect(inputChannelSplitterNodes[i]);
            for (let j = 0; j < options.channelCount; j += 1) {
                inputChannelSplitterNodes[i].connect(inputChannelMergerNode, j, i * options.channelCount + j);
            }
        }
        const parameterMap = new ReadOnlyMap(processorConstructor.parameterDescriptors === undefined
            ? []
            : processorConstructor.parameterDescriptors.map(({ name }, index) => {
                const constantSourceNode = constantSourceNodes[index];
                constantSourceNode.connect(inputChannelMergerNode, 0, numberOfInputChannels + index);
                constantSourceNode.start(0);
                return [name, constantSourceNode.offset];
            }));
        inputChannelMergerNode.connect(scriptProcessorNode);
        let channelInterpretation = options.channelInterpretation;
        let onprocessorerror = null;
        // Bug #87: Expose at least one output to make this node connectable.
        const outputAudioNodes = options.numberOfOutputs === 0 ? [scriptProcessorNode] : outputChannelMergerNodes;
        const nativeAudioWorkletNodeFaker = {
            get bufferSize() {
                return bufferSize;
            },
            get channelCount() {
                return options.channelCount;
            },
            set channelCount(_) {
                // Bug #61: This is not part of the standard but required for the faker to work.
                throw createInvalidStateError();
            },
            get channelCountMode() {
                return options.channelCountMode;
            },
            set channelCountMode(_) {
                // Bug #61: This is not part of the standard but required for the faker to work.
                throw createInvalidStateError();
            },
            get channelInterpretation() {
                return channelInterpretation;
            },
            set channelInterpretation(value) {
                for (const gainNode of gainNodes) {
                    gainNode.channelInterpretation = value;
                }
                channelInterpretation = value;
            },
            get context() {
                return scriptProcessorNode.context;
            },
            get inputs() {
                return gainNodes;
            },
            get numberOfInputs() {
                return options.numberOfInputs;
            },
            get numberOfOutputs() {
                return options.numberOfOutputs;
            },
            get onprocessorerror() {
                return onprocessorerror;
            },
            set onprocessorerror(value) {
                if (typeof onprocessorerror === 'function') {
                    nativeAudioWorkletNodeFaker.removeEventListener('processorerror', onprocessorerror);
                }
                onprocessorerror = typeof value === 'function' ? value : null;
                if (typeof onprocessorerror === 'function') {
                    nativeAudioWorkletNodeFaker.addEventListener('processorerror', onprocessorerror);
                }
            },
            get parameters() {
                return parameterMap;
            },
            get port() {
                return messageChannel.port2;
            },
            addEventListener(...args) {
                return scriptProcessorNode.addEventListener(args[0], args[1], args[2]);
            },
            connect: connectMultipleOutputs.bind(null, outputAudioNodes),
            disconnect: disconnectMultipleOutputs.bind(null, outputAudioNodes),
            dispatchEvent(...args) {
                return scriptProcessorNode.dispatchEvent(args[0]);
            },
            removeEventListener(...args) {
                return scriptProcessorNode.removeEventListener(args[0], args[1], args[2]);
            }
        };
        const patchedEventListeners = new Map();
        messageChannel.port1.addEventListener = ((addEventListener) => {
            return (...args) => {
                if (args[0] === 'message') {
                    const unpatchedEventListener = typeof args[1] === 'function'
                        ? args[1]
                        : typeof args[1] === 'object' && args[1] !== null && typeof args[1].handleEvent === 'function'
                            ? args[1].handleEvent
                            : null;
                    if (unpatchedEventListener !== null) {
                        const patchedEventListener = patchedEventListeners.get(args[1]);
                        if (patchedEventListener !== undefined) {
                            args[1] = patchedEventListener;
                        }
                        else {
                            args[1] = (event) => {
                                exposeCurrentFrameAndCurrentTime(nativeContext.currentTime, nativeContext.sampleRate, () => unpatchedEventListener(event));
                            };
                            patchedEventListeners.set(unpatchedEventListener, args[1]);
                        }
                    }
                }
                return addEventListener.call(messageChannel.port1, args[0], args[1], args[2]);
            };
        })(messageChannel.port1.addEventListener);
        messageChannel.port1.removeEventListener = ((removeEventListener) => {
            return (...args) => {
                if (args[0] === 'message') {
                    const patchedEventListener = patchedEventListeners.get(args[1]);
                    if (patchedEventListener !== undefined) {
                        patchedEventListeners.delete(args[1]);
                        args[1] = patchedEventListener;
                    }
                }
                return removeEventListener.call(messageChannel.port1, args[0], args[1], args[2]);
            };
        })(messageChannel.port1.removeEventListener);
        let onmessage = null;
        Object.defineProperty(messageChannel.port1, 'onmessage', {
            get: () => onmessage,
            set: (value) => {
                if (typeof onmessage === 'function') {
                    messageChannel.port1.removeEventListener('message', onmessage);
                }
                onmessage = typeof value === 'function' ? value : null;
                if (typeof onmessage === 'function') {
                    messageChannel.port1.addEventListener('message', onmessage);
                    messageChannel.port1.start();
                }
            }
        });
        processorConstructor.prototype.port = messageChannel.port1;
        let audioWorkletProcessor = null;
        const audioWorkletProcessorPromise = createAudioWorkletProcessor(nativeContext, nativeAudioWorkletNodeFaker, processorConstructor, options);
        audioWorkletProcessorPromise.then((dWrkltPrcssr) => (audioWorkletProcessor = dWrkltPrcssr));
        const inputs = createNestedArrays(options.numberOfInputs, options.channelCount);
        const outputs = createNestedArrays(options.numberOfOutputs, outputChannelCount);
        const parameters = processorConstructor.parameterDescriptors === undefined
            ? []
            : processorConstructor.parameterDescriptors.reduce((prmtrs, { name }) => ({ ...prmtrs, [name]: new Float32Array(128) }), {});
        let isActive = true;
        const disconnectOutputsGraph = () => {
            if (options.numberOfOutputs > 0) {
                scriptProcessorNode.disconnect(outputChannelSplitterNode);
            }
            for (let i = 0, outputChannelSplitterNodeOutput = 0; i < options.numberOfOutputs; i += 1) {
                const outputChannelMergerNode = outputChannelMergerNodes[i];
                for (let j = 0; j < outputChannelCount[i]; j += 1) {
                    outputChannelSplitterNode.disconnect(outputChannelMergerNode, outputChannelSplitterNodeOutput + j, j);
                }
                outputChannelSplitterNodeOutput += outputChannelCount[i];
            }
        };
        const activeInputIndexes = new Map();
        // tslint:disable-next-line:deprecation
        scriptProcessorNode.onaudioprocess = ({ inputBuffer, outputBuffer }) => {
            if (audioWorkletProcessor !== null) {
                const activeInputs = getActiveAudioWorkletNodeInputs(nativeAudioWorkletNodeFaker);
                for (let i = 0; i < bufferSize; i += 128) {
                    for (let j = 0; j < options.numberOfInputs; j += 1) {
                        for (let k = 0; k < options.channelCount; k += 1) {
                            copyFromChannel(inputBuffer, inputs[j], k, k, i);
                        }
                    }
                    if (processorConstructor.parameterDescriptors !== undefined) {
                        processorConstructor.parameterDescriptors.forEach(({ name }, index) => {
                            copyFromChannel(inputBuffer, parameters, name, numberOfInputChannels + index, i);
                        });
                    }
                    for (let j = 0; j < options.numberOfInputs; j += 1) {
                        for (let k = 0; k < outputChannelCount[j]; k += 1) {
                            // The byteLength will be 0 when the ArrayBuffer was transferred.
                            if (outputs[j][k].byteLength === 0) {
                                outputs[j][k] = new Float32Array(128);
                            }
                        }
                    }
                    try {
                        const potentiallyEmptyInputs = inputs.map((input, index) => {
                            const activeInput = activeInputs[index];
                            if (activeInput.size > 0) {
                                activeInputIndexes.set(index, bufferSize / 128);
                                return input;
                            }
                            const count = activeInputIndexes.get(index);
                            if (count === undefined) {
                                return [];
                            }
                            if (input.every((channelData) => channelData.every((sample) => sample === 0))) {
                                if (count === 1) {
                                    activeInputIndexes.delete(index);
                                }
                                else {
                                    activeInputIndexes.set(index, count - 1);
                                }
                            }
                            return input;
                        });
                        const activeSourceFlag = exposeCurrentFrameAndCurrentTime(nativeContext.currentTime + i / nativeContext.sampleRate, nativeContext.sampleRate, () => audioWorkletProcessor.process(potentiallyEmptyInputs, outputs, parameters));
                        isActive = activeSourceFlag;
                        for (let j = 0, outputChannelSplitterNodeOutput = 0; j < options.numberOfOutputs; j += 1) {
                            for (let k = 0; k < outputChannelCount[j]; k += 1) {
                                copyToChannel(outputBuffer, outputs[j], k, outputChannelSplitterNodeOutput + k, i);
                            }
                            outputChannelSplitterNodeOutput += outputChannelCount[j];
                        }
                    }
                    catch (error) {
                        isActive = false;
                        nativeAudioWorkletNodeFaker.dispatchEvent(new ErrorEvent('processorerror', {
                            colno: error.colno,
                            filename: error.filename,
                            lineno: error.lineno,
                            message: error.message
                        }));
                    }
                    if (!isActive) {
                        for (let j = 0; j < options.numberOfInputs; j += 1) {
                            gainNodes[j].disconnect(inputChannelSplitterNodes[j]);
                            for (let k = 0; k < options.channelCount; k += 1) {
                                inputChannelSplitterNodes[i].disconnect(inputChannelMergerNode, k, j * options.channelCount + k);
                            }
                        }
                        if (processorConstructor.parameterDescriptors !== undefined) {
                            const length = processorConstructor.parameterDescriptors.length;
                            for (let j = 0; j < length; j += 1) {
                                const constantSourceNode = constantSourceNodes[j];
                                constantSourceNode.disconnect(inputChannelMergerNode, 0, numberOfInputChannels + j);
                                constantSourceNode.stop();
                            }
                        }
                        inputChannelMergerNode.disconnect(scriptProcessorNode);
                        scriptProcessorNode.onaudioprocess = null; // tslint:disable-line:deprecation
                        if (isConnected) {
                            disconnectOutputsGraph();
                        }
                        else {
                            disconnectFakeGraph();
                        }
                        break;
                    }
                }
            }
        };
        let isConnected = false;
        // Bug #87: Only Firefox will fire an AudioProcessingEvent if there is no connected output.
        const nativeGainNode = createNativeGainNode(nativeContext, {
            channelCount: 1,
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete',
            gain: 0
        });
        const connectFakeGraph = () => scriptProcessorNode.connect(nativeGainNode).connect(nativeContext.destination);
        const disconnectFakeGraph = () => {
            scriptProcessorNode.disconnect(nativeGainNode);
            nativeGainNode.disconnect();
        };
        const whenConnected = () => {
            if (isActive) {
                disconnectFakeGraph();
                if (options.numberOfOutputs > 0) {
                    scriptProcessorNode.connect(outputChannelSplitterNode);
                }
                for (let i = 0, outputChannelSplitterNodeOutput = 0; i < options.numberOfOutputs; i += 1) {
                    const outputChannelMergerNode = outputChannelMergerNodes[i];
                    for (let j = 0; j < outputChannelCount[i]; j += 1) {
                        outputChannelSplitterNode.connect(outputChannelMergerNode, outputChannelSplitterNodeOutput + j, j);
                    }
                    outputChannelSplitterNodeOutput += outputChannelCount[i];
                }
            }
            isConnected = true;
        };
        const whenDisconnected = () => {
            if (isActive) {
                connectFakeGraph();
                disconnectOutputsGraph();
            }
            isConnected = false;
        };
        connectFakeGraph();
        return monitorConnections(nativeAudioWorkletNodeFaker, whenConnected, whenDisconnected);
    };
};

const createNativeBiquadFilterNode = (nativeContext, options) => {
    const nativeBiquadFilterNode = nativeContext.createBiquadFilter();
    assignNativeAudioNodeOptions(nativeBiquadFilterNode, options);
    assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, 'Q');
    assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, 'detune');
    assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, 'frequency');
    assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, 'gain');
    assignNativeAudioNodeOption(nativeBiquadFilterNode, options, 'type');
    return nativeBiquadFilterNode;
};

const createNativeChannelMergerNodeFactory = (nativeAudioContextConstructor, wrapChannelMergerNode) => {
    return (nativeContext, options) => {
        const nativeChannelMergerNode = nativeContext.createChannelMerger(options.numberOfInputs);
        /*
         * Bug #20: Safari requires a connection of any kind to treat the input signal correctly.
         * @todo Unfortunately there is no way to test for this behavior in a synchronous fashion which is why testing for the existence of
         * the webkitAudioContext is used as a workaround here.
         */
        if (nativeAudioContextConstructor !== null && nativeAudioContextConstructor.name === 'webkitAudioContext') {
            wrapChannelMergerNode(nativeContext, nativeChannelMergerNode);
        }
        assignNativeAudioNodeOptions(nativeChannelMergerNode, options);
        return nativeChannelMergerNode;
    };
};

const wrapChannelSplitterNode = (channelSplitterNode) => {
    const channelCount = channelSplitterNode.numberOfOutputs;
    // Bug #97: Safari does not throw an error when attempting to change the channelCount to something other than its initial value.
    Object.defineProperty(channelSplitterNode, 'channelCount', {
        get: () => channelCount,
        set: (value) => {
            if (value !== channelCount) {
                throw createInvalidStateError();
            }
        }
    });
    // Bug #30: Safari does not throw an error when attempting to change the channelCountMode to something other than explicit.
    Object.defineProperty(channelSplitterNode, 'channelCountMode', {
        get: () => 'explicit',
        set: (value) => {
            if (value !== 'explicit') {
                throw createInvalidStateError();
            }
        }
    });
    // Bug #32: Safari does not throw an error when attempting to change the channelInterpretation to something other than discrete.
    Object.defineProperty(channelSplitterNode, 'channelInterpretation', {
        get: () => 'discrete',
        set: (value) => {
            if (value !== 'discrete') {
                throw createInvalidStateError();
            }
        }
    });
};

const createNativeChannelSplitterNode = (nativeContext, options) => {
    const nativeChannelSplitterNode = nativeContext.createChannelSplitter(options.numberOfOutputs);
    // Bug #96: Safari does not have the correct channelCount.
    // Bug #29: Safari does not have the correct channelCountMode.
    // Bug #31: Safari does not have the correct channelInterpretation.
    assignNativeAudioNodeOptions(nativeChannelSplitterNode, options);
    // Bug #29, #30, #31, #32, #96 & #97: Only Chrome, Edge, Firefox & Opera partially support the spec yet.
    wrapChannelSplitterNode(nativeChannelSplitterNode);
    return nativeChannelSplitterNode;
};

const createNativeConstantSourceNodeFactory = (addSilentConnection, cacheTestResult, createNativeConstantSourceNodeFaker, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport) => {
    return (nativeContext, options) => {
        // Bug #62: Safari does not support ConstantSourceNodes.
        if (nativeContext.createConstantSource === undefined) {
            return createNativeConstantSourceNodeFaker(nativeContext, options);
        }
        const nativeConstantSourceNode = nativeContext.createConstantSource();
        assignNativeAudioNodeOptions(nativeConstantSourceNode, options);
        assignNativeAudioNodeAudioParamValue(nativeConstantSourceNode, options, 'offset');
        // Bug #44: Safari does not throw a RangeError yet.
        if (!cacheTestResult(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, () => testAudioScheduledSourceNodeStartMethodNegativeParametersSupport(nativeContext))) {
            wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeConstantSourceNode);
        }
        // Bug #44: Only Firefox does not throw a RangeError yet.
        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, () => testAudioScheduledSourceNodeStopMethodNegativeParametersSupport(nativeContext))) {
            wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeConstantSourceNode);
        }
        // Bug #175: Safari will not fire an ended event if the ConstantSourceNode is unconnected.
        addSilentConnection(nativeContext, nativeConstantSourceNode);
        return nativeConstantSourceNode;
    };
};

const interceptConnections = (original, interceptor) => {
    original.connect = interceptor.connect.bind(interceptor);
    original.disconnect = interceptor.disconnect.bind(interceptor);
    return original;
};

const createNativeConstantSourceNodeFakerFactory = (addSilentConnection, createNativeAudioBufferSourceNode, createNativeGainNode, monitorConnections) => {
    return (nativeContext, { offset, ...audioNodeOptions }) => {
        const audioBuffer = nativeContext.createBuffer(1, 2, 44100);
        const audioBufferSourceNode = createNativeAudioBufferSourceNode(nativeContext, {
            buffer: null,
            channelCount: 2,
            channelCountMode: 'max',
            channelInterpretation: 'speakers',
            loop: false,
            loopEnd: 0,
            loopStart: 0,
            playbackRate: 1
        });
        const gainNode = createNativeGainNode(nativeContext, { ...audioNodeOptions, gain: offset });
        // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
        const channelData = audioBuffer.getChannelData(0);
        // Bug #95: Safari does not play or loop one sample buffers.
        channelData[0] = 1;
        channelData[1] = 1;
        audioBufferSourceNode.buffer = audioBuffer;
        audioBufferSourceNode.loop = true;
        const nativeConstantSourceNodeFaker = {
            get bufferSize() {
                return undefined;
            },
            get channelCount() {
                return gainNode.channelCount;
            },
            set channelCount(value) {
                gainNode.channelCount = value;
            },
            get channelCountMode() {
                return gainNode.channelCountMode;
            },
            set channelCountMode(value) {
                gainNode.channelCountMode = value;
            },
            get channelInterpretation() {
                return gainNode.channelInterpretation;
            },
            set channelInterpretation(value) {
                gainNode.channelInterpretation = value;
            },
            get context() {
                return gainNode.context;
            },
            get inputs() {
                return [];
            },
            get numberOfInputs() {
                return audioBufferSourceNode.numberOfInputs;
            },
            get numberOfOutputs() {
                return gainNode.numberOfOutputs;
            },
            get offset() {
                return gainNode.gain;
            },
            get onended() {
                return audioBufferSourceNode.onended;
            },
            set onended(value) {
                audioBufferSourceNode.onended = value;
            },
            addEventListener(...args) {
                return audioBufferSourceNode.addEventListener(args[0], args[1], args[2]);
            },
            dispatchEvent(...args) {
                return audioBufferSourceNode.dispatchEvent(args[0]);
            },
            removeEventListener(...args) {
                return audioBufferSourceNode.removeEventListener(args[0], args[1], args[2]);
            },
            start(when = 0) {
                audioBufferSourceNode.start.call(audioBufferSourceNode, when);
            },
            stop(when = 0) {
                audioBufferSourceNode.stop.call(audioBufferSourceNode, when);
            }
        };
        const whenConnected = () => audioBufferSourceNode.connect(gainNode);
        const whenDisconnected = () => audioBufferSourceNode.disconnect(gainNode);
        // Bug #175: Safari will not fire an ended event if the AudioBufferSourceNode is unconnected.
        addSilentConnection(nativeContext, audioBufferSourceNode);
        return monitorConnections(interceptConnections(nativeConstantSourceNodeFaker, gainNode), whenConnected, whenDisconnected);
    };
};

const createNativeConvolverNodeFactory = (createNotSupportedError, overwriteAccessors) => {
    return (nativeContext, options) => {
        const nativeConvolverNode = nativeContext.createConvolver();
        assignNativeAudioNodeOptions(nativeConvolverNode, options);
        // The normalize property needs to be set before setting the buffer.
        if (options.disableNormalization === nativeConvolverNode.normalize) {
            nativeConvolverNode.normalize = !options.disableNormalization;
        }
        assignNativeAudioNodeOption(nativeConvolverNode, options, 'buffer');
        // Bug #113: Safari does allow to set the channelCount to a value larger than 2.
        if (options.channelCount > 2) {
            throw createNotSupportedError();
        }
        overwriteAccessors(nativeConvolverNode, 'channelCount', (get) => () => get.call(nativeConvolverNode), (set) => (value) => {
            if (value > 2) {
                throw createNotSupportedError();
            }
            return set.call(nativeConvolverNode, value);
        });
        // Bug #114: Safari allows to set the channelCountMode to 'max'.
        if (options.channelCountMode === 'max') {
            throw createNotSupportedError();
        }
        overwriteAccessors(nativeConvolverNode, 'channelCountMode', (get) => () => get.call(nativeConvolverNode), (set) => (value) => {
            if (value === 'max') {
                throw createNotSupportedError();
            }
            return set.call(nativeConvolverNode, value);
        });
        return nativeConvolverNode;
    };
};

const createNativeDelayNode = (nativeContext, options) => {
    const nativeDelayNode = nativeContext.createDelay(options.maxDelayTime);
    assignNativeAudioNodeOptions(nativeDelayNode, options);
    assignNativeAudioNodeAudioParamValue(nativeDelayNode, options, 'delayTime');
    return nativeDelayNode;
};

const createNativeDynamicsCompressorNodeFactory = (createNotSupportedError) => {
    return (nativeContext, options) => {
        const nativeDynamicsCompressorNode = nativeContext.createDynamicsCompressor();
        assignNativeAudioNodeOptions(nativeDynamicsCompressorNode, options);
        // Bug #108: Safari allows a channelCount of three and above.
        if (options.channelCount > 2) {
            throw createNotSupportedError();
        }
        // Bug #109: Only Chrome, Firefox and Opera disallow a channelCountMode of 'max'.
        if (options.channelCountMode === 'max') {
            throw createNotSupportedError();
        }
        assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, 'attack');
        assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, 'knee');
        assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, 'ratio');
        assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, 'release');
        assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, 'threshold');
        return nativeDynamicsCompressorNode;
    };
};

const createNativeGainNode = (nativeContext, options) => {
    const nativeGainNode = nativeContext.createGain();
    assignNativeAudioNodeOptions(nativeGainNode, options);
    assignNativeAudioNodeAudioParamValue(nativeGainNode, options, 'gain');
    return nativeGainNode;
};

const createNativeIIRFilterNodeFactory = (createNativeIIRFilterNodeFaker) => {
    return (nativeContext, baseLatency, options) => {
        // Bug #9: Safari does not support IIRFilterNodes.
        if (nativeContext.createIIRFilter === undefined) {
            return createNativeIIRFilterNodeFaker(nativeContext, baseLatency, options);
        }
        // @todo TypeScript defines the parameters of createIIRFilter() as arrays of numbers.
        const nativeIIRFilterNode = nativeContext.createIIRFilter(options.feedforward, options.feedback);
        assignNativeAudioNodeOptions(nativeIIRFilterNode, options);
        return nativeIIRFilterNode;
    };
};

function divide(a, b) {
    const denominator = b[0] * b[0] + b[1] * b[1];
    return [(a[0] * b[0] + a[1] * b[1]) / denominator, (a[1] * b[0] - a[0] * b[1]) / denominator];
}
function multiply(a, b) {
    return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}
function evaluatePolynomial(coefficient, z) {
    let result = [0, 0];
    for (let i = coefficient.length - 1; i >= 0; i -= 1) {
        result = multiply(result, z);
        result[0] += coefficient[i];
    }
    return result;
}
const createNativeIIRFilterNodeFakerFactory = (createInvalidAccessError, createInvalidStateError, createNativeScriptProcessorNode, createNotSupportedError) => {
    return (nativeContext, baseLatency, { channelCount, channelCountMode, channelInterpretation, feedback, feedforward }) => {
        const bufferSize = computeBufferSize(baseLatency, nativeContext.sampleRate);
        const convertedFeedback = feedback instanceof Float64Array ? feedback : new Float64Array(feedback);
        const convertedFeedforward = feedforward instanceof Float64Array ? feedforward : new Float64Array(feedforward);
        const feedbackLength = convertedFeedback.length;
        const feedforwardLength = convertedFeedforward.length;
        const minLength = Math.min(feedbackLength, feedforwardLength);
        if (feedbackLength === 0 || feedbackLength > 20) {
            throw createNotSupportedError();
        }
        if (convertedFeedback[0] === 0) {
            throw createInvalidStateError();
        }
        if (feedforwardLength === 0 || feedforwardLength > 20) {
            throw createNotSupportedError();
        }
        if (convertedFeedforward[0] === 0) {
            throw createInvalidStateError();
        }
        if (convertedFeedback[0] !== 1) {
            for (let i = 0; i < feedforwardLength; i += 1) {
                convertedFeedforward[i] /= convertedFeedback[0];
            }
            for (let i = 1; i < feedbackLength; i += 1) {
                convertedFeedback[i] /= convertedFeedback[0];
            }
        }
        const scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, bufferSize, channelCount, channelCount);
        scriptProcessorNode.channelCount = channelCount;
        scriptProcessorNode.channelCountMode = channelCountMode;
        scriptProcessorNode.channelInterpretation = channelInterpretation;
        const bufferLength = 32;
        const bufferIndexes = [];
        const xBuffers = [];
        const yBuffers = [];
        for (let i = 0; i < channelCount; i += 1) {
            bufferIndexes.push(0);
            const xBuffer = new Float32Array(bufferLength);
            const yBuffer = new Float32Array(bufferLength);
            xBuffer.fill(0);
            yBuffer.fill(0);
            xBuffers.push(xBuffer);
            yBuffers.push(yBuffer);
        }
        // tslint:disable-next-line:deprecation
        scriptProcessorNode.onaudioprocess = (event) => {
            const inputBuffer = event.inputBuffer;
            const outputBuffer = event.outputBuffer;
            const numberOfChannels = inputBuffer.numberOfChannels;
            for (let i = 0; i < numberOfChannels; i += 1) {
                const input = inputBuffer.getChannelData(i);
                const output = outputBuffer.getChannelData(i);
                bufferIndexes[i] = filterBuffer(convertedFeedback, feedbackLength, convertedFeedforward, feedforwardLength, minLength, xBuffers[i], yBuffers[i], bufferIndexes[i], bufferLength, input, output);
            }
        };
        const nyquist = nativeContext.sampleRate / 2;
        const nativeIIRFilterNodeFaker = {
            get bufferSize() {
                return bufferSize;
            },
            get channelCount() {
                return scriptProcessorNode.channelCount;
            },
            set channelCount(value) {
                scriptProcessorNode.channelCount = value;
            },
            get channelCountMode() {
                return scriptProcessorNode.channelCountMode;
            },
            set channelCountMode(value) {
                scriptProcessorNode.channelCountMode = value;
            },
            get channelInterpretation() {
                return scriptProcessorNode.channelInterpretation;
            },
            set channelInterpretation(value) {
                scriptProcessorNode.channelInterpretation = value;
            },
            get context() {
                return scriptProcessorNode.context;
            },
            get inputs() {
                return [scriptProcessorNode];
            },
            get numberOfInputs() {
                return scriptProcessorNode.numberOfInputs;
            },
            get numberOfOutputs() {
                return scriptProcessorNode.numberOfOutputs;
            },
            addEventListener(...args) {
                // @todo Dissallow adding an audioprocess listener.
                return scriptProcessorNode.addEventListener(args[0], args[1], args[2]);
            },
            dispatchEvent(...args) {
                return scriptProcessorNode.dispatchEvent(args[0]);
            },
            getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
                if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) {
                    throw createInvalidAccessError();
                }
                const length = frequencyHz.length;
                for (let i = 0; i < length; i += 1) {
                    const omega = -Math.PI * (frequencyHz[i] / nyquist);
                    const z = [Math.cos(omega), Math.sin(omega)];
                    const numerator = evaluatePolynomial(convertedFeedforward, z);
                    const denominator = evaluatePolynomial(convertedFeedback, z);
                    const response = divide(numerator, denominator);
                    magResponse[i] = Math.sqrt(response[0] * response[0] + response[1] * response[1]);
                    phaseResponse[i] = Math.atan2(response[1], response[0]);
                }
            },
            removeEventListener(...args) {
                return scriptProcessorNode.removeEventListener(args[0], args[1], args[2]);
            }
        };
        return interceptConnections(nativeIIRFilterNodeFaker, scriptProcessorNode);
    };
};

const createNativeMediaElementAudioSourceNode = (nativeAudioContext, options) => {
    return nativeAudioContext.createMediaElementSource(options.mediaElement);
};

const createNativeMediaStreamAudioDestinationNode = (nativeAudioContext, options) => {
    const nativeMediaStreamAudioDestinationNode = nativeAudioContext.createMediaStreamDestination();
    assignNativeAudioNodeOptions(nativeMediaStreamAudioDestinationNode, options);
    // Bug #174: Safari does expose a wrong numberOfOutputs.
    if (nativeMediaStreamAudioDestinationNode.numberOfOutputs === 1) {
        Object.defineProperty(nativeMediaStreamAudioDestinationNode, 'numberOfOutputs', { get: () => 0 });
    }
    return nativeMediaStreamAudioDestinationNode;
};

const createNativeMediaStreamAudioSourceNode = (nativeAudioContext, { mediaStream }) => {
    const audioStreamTracks = mediaStream.getAudioTracks();
    /*
     * Bug #151: Safari does not use the audio track as input anymore if it gets removed from the mediaStream after construction.
     * Bug #159: Safari picks the first audio track if the MediaStream has more than one audio track.
     */
    audioStreamTracks.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const filteredAudioStreamTracks = audioStreamTracks.slice(0, 1);
    const nativeMediaStreamAudioSourceNode = nativeAudioContext.createMediaStreamSource(new MediaStream(filteredAudioStreamTracks));
    /*
     * Bug #151 & #159: The given mediaStream gets reconstructed before it gets passed to the native node which is why the accessor needs
     * to be overwritten as it would otherwise expose the reconstructed version.
     */
    Object.defineProperty(nativeMediaStreamAudioSourceNode, 'mediaStream', { value: mediaStream });
    return nativeMediaStreamAudioSourceNode;
};

const createNativeMediaStreamTrackAudioSourceNodeFactory = (createInvalidStateError, isNativeOfflineAudioContext) => {
    return (nativeAudioContext, { mediaStreamTrack }) => {
        // Bug #121: Only Firefox does yet support the MediaStreamTrackAudioSourceNode.
        if (typeof nativeAudioContext.createMediaStreamTrackSource === 'function') {
            return nativeAudioContext.createMediaStreamTrackSource(mediaStreamTrack);
        }
        const mediaStream = new MediaStream([mediaStreamTrack]);
        const nativeMediaStreamAudioSourceNode = nativeAudioContext.createMediaStreamSource(mediaStream);
        // Bug #120: Firefox does not throw an error if the mediaStream has no audio track.
        if (mediaStreamTrack.kind !== 'audio') {
            throw createInvalidStateError();
        }
        // Bug #172: Safari allows to create a MediaStreamAudioSourceNode with an OfflineAudioContext.
        if (isNativeOfflineAudioContext(nativeAudioContext)) {
            throw new TypeError();
        }
        return nativeMediaStreamAudioSourceNode;
    };
};

const createNativeOfflineAudioContextConstructor = (window) => {
    if (window === null) {
        return null;
    }
    if (window.hasOwnProperty('OfflineAudioContext')) {
        return window.OfflineAudioContext;
    }
    return window.hasOwnProperty('webkitOfflineAudioContext') ? window.webkitOfflineAudioContext : null;
};

const createNativeOscillatorNodeFactory = (addSilentConnection, cacheTestResult, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls) => {
    return (nativeContext, options) => {
        const nativeOscillatorNode = nativeContext.createOscillator();
        assignNativeAudioNodeOptions(nativeOscillatorNode, options);
        assignNativeAudioNodeAudioParamValue(nativeOscillatorNode, options, 'detune');
        assignNativeAudioNodeAudioParamValue(nativeOscillatorNode, options, 'frequency');
        if (options.periodicWave !== undefined) {
            nativeOscillatorNode.setPeriodicWave(options.periodicWave);
        }
        else {
            assignNativeAudioNodeOption(nativeOscillatorNode, options, 'type');
        }
        // Bug #44: Only Chrome, Edge & Opera throw a RangeError yet.
        if (!cacheTestResult(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, () => testAudioScheduledSourceNodeStartMethodNegativeParametersSupport(nativeContext))) {
            wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeOscillatorNode);
        }
        // Bug #19: Safari does not ignore calls to stop() of an already stopped AudioBufferSourceNode.
        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, () => testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport(nativeContext))) {
            wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls(nativeOscillatorNode, nativeContext);
        }
        // Bug #44: Only Firefox does not throw a RangeError yet.
        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, () => testAudioScheduledSourceNodeStopMethodNegativeParametersSupport(nativeContext))) {
            wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeOscillatorNode);
        }
        // Bug #175: Safari will not fire an ended event if the OscillatorNode is unconnected.
        addSilentConnection(nativeContext, nativeOscillatorNode);
        return nativeOscillatorNode;
    };
};

const createNativePannerNodeFactory = (createNativePannerNodeFaker) => {
    return (nativeContext, options) => {
        const nativePannerNode = nativeContext.createPanner();
        // Bug #124: Safari does not support modifying the orientation and the position with AudioParams.
        if (nativePannerNode.orientationX === undefined) {
            return createNativePannerNodeFaker(nativeContext, options);
        }
        assignNativeAudioNodeOptions(nativePannerNode, options);
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'orientationX');
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'orientationY');
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'orientationZ');
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'positionX');
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'positionY');
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'positionZ');
        assignNativeAudioNodeOption(nativePannerNode, options, 'coneInnerAngle');
        assignNativeAudioNodeOption(nativePannerNode, options, 'coneOuterAngle');
        assignNativeAudioNodeOption(nativePannerNode, options, 'coneOuterGain');
        assignNativeAudioNodeOption(nativePannerNode, options, 'distanceModel');
        assignNativeAudioNodeOption(nativePannerNode, options, 'maxDistance');
        assignNativeAudioNodeOption(nativePannerNode, options, 'panningModel');
        assignNativeAudioNodeOption(nativePannerNode, options, 'refDistance');
        assignNativeAudioNodeOption(nativePannerNode, options, 'rolloffFactor');
        return nativePannerNode;
    };
};

const createNativePannerNodeFakerFactory = (connectNativeAudioNodeToNativeAudioNode, createInvalidStateError, createNativeChannelMergerNode, createNativeGainNode, createNativeScriptProcessorNode, createNativeWaveShaperNode, createNotSupportedError, disconnectNativeAudioNodeFromNativeAudioNode, getFirstSample, monitorConnections) => {
    return (nativeContext, { coneInnerAngle, coneOuterAngle, coneOuterGain, distanceModel, maxDistance, orientationX, orientationY, orientationZ, panningModel, positionX, positionY, positionZ, refDistance, rolloffFactor, ...audioNodeOptions }) => {
        const pannerNode = nativeContext.createPanner();
        // Bug #125: Safari does not throw an error yet.
        if (audioNodeOptions.channelCount > 2) {
            throw createNotSupportedError();
        }
        // Bug #126: Safari does not throw an error yet.
        if (audioNodeOptions.channelCountMode === 'max') {
            throw createNotSupportedError();
        }
        assignNativeAudioNodeOptions(pannerNode, audioNodeOptions);
        const SINGLE_CHANNEL_OPTIONS = {
            channelCount: 1,
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete'
        };
        const channelMergerNode = createNativeChannelMergerNode(nativeContext, {
            ...SINGLE_CHANNEL_OPTIONS,
            channelInterpretation: 'speakers',
            numberOfInputs: 6
        });
        const inputGainNode = createNativeGainNode(nativeContext, { ...audioNodeOptions, gain: 1 });
        const orientationXGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 1 });
        const orientationYGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 0 });
        const orientationZGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 0 });
        const positionXGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 0 });
        const positionYGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 0 });
        const positionZGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 0 });
        const scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, 256, 6, 1);
        const waveShaperNode = createNativeWaveShaperNode(nativeContext, {
            ...SINGLE_CHANNEL_OPTIONS,
            curve: new Float32Array([1, 1]),
            oversample: 'none'
        });
        let lastOrientation = [orientationX, orientationY, orientationZ];
        let lastPosition = [positionX, positionY, positionZ];
        const buffer = new Float32Array(1);
        // tslint:disable-next-line:deprecation
        scriptProcessorNode.onaudioprocess = ({ inputBuffer }) => {
            const orientation = [
                getFirstSample(inputBuffer, buffer, 0),
                getFirstSample(inputBuffer, buffer, 1),
                getFirstSample(inputBuffer, buffer, 2)
            ];
            if (orientation.some((value, index) => value !== lastOrientation[index])) {
                pannerNode.setOrientation(...orientation); // tslint:disable-line:deprecation
                lastOrientation = orientation;
            }
            const positon = [
                getFirstSample(inputBuffer, buffer, 3),
                getFirstSample(inputBuffer, buffer, 4),
                getFirstSample(inputBuffer, buffer, 5)
            ];
            if (positon.some((value, index) => value !== lastPosition[index])) {
                pannerNode.setPosition(...positon); // tslint:disable-line:deprecation
                lastPosition = positon;
            }
        };
        Object.defineProperty(orientationYGainNode.gain, 'defaultValue', { get: () => 0 });
        Object.defineProperty(orientationZGainNode.gain, 'defaultValue', { get: () => 0 });
        Object.defineProperty(positionXGainNode.gain, 'defaultValue', { get: () => 0 });
        Object.defineProperty(positionYGainNode.gain, 'defaultValue', { get: () => 0 });
        Object.defineProperty(positionZGainNode.gain, 'defaultValue', { get: () => 0 });
        const nativePannerNodeFaker = {
            get bufferSize() {
                return undefined;
            },
            get channelCount() {
                return pannerNode.channelCount;
            },
            set channelCount(value) {
                // Bug #125: Safari does not throw an error yet.
                if (value > 2) {
                    throw createNotSupportedError();
                }
                inputGainNode.channelCount = value;
                pannerNode.channelCount = value;
            },
            get channelCountMode() {
                return pannerNode.channelCountMode;
            },
            set channelCountMode(value) {
                // Bug #126: Safari does not throw an error yet.
                if (value === 'max') {
                    throw createNotSupportedError();
                }
                inputGainNode.channelCountMode = value;
                pannerNode.channelCountMode = value;
            },
            get channelInterpretation() {
                return pannerNode.channelInterpretation;
            },
            set channelInterpretation(value) {
                inputGainNode.channelInterpretation = value;
                pannerNode.channelInterpretation = value;
            },
            get coneInnerAngle() {
                return pannerNode.coneInnerAngle;
            },
            set coneInnerAngle(value) {
                pannerNode.coneInnerAngle = value;
            },
            get coneOuterAngle() {
                return pannerNode.coneOuterAngle;
            },
            set coneOuterAngle(value) {
                pannerNode.coneOuterAngle = value;
            },
            get coneOuterGain() {
                return pannerNode.coneOuterGain;
            },
            set coneOuterGain(value) {
                // Bug #127: Safari does not throw an InvalidStateError yet.
                if (value < 0 || value > 1) {
                    throw createInvalidStateError();
                }
                pannerNode.coneOuterGain = value;
            },
            get context() {
                return pannerNode.context;
            },
            get distanceModel() {
                return pannerNode.distanceModel;
            },
            set distanceModel(value) {
                pannerNode.distanceModel = value;
            },
            get inputs() {
                return [inputGainNode];
            },
            get maxDistance() {
                return pannerNode.maxDistance;
            },
            set maxDistance(value) {
                // Bug #128: Safari does not throw an error yet.
                if (value < 0) {
                    throw new RangeError();
                }
                pannerNode.maxDistance = value;
            },
            get numberOfInputs() {
                return pannerNode.numberOfInputs;
            },
            get numberOfOutputs() {
                return pannerNode.numberOfOutputs;
            },
            get orientationX() {
                return orientationXGainNode.gain;
            },
            get orientationY() {
                return orientationYGainNode.gain;
            },
            get orientationZ() {
                return orientationZGainNode.gain;
            },
            get panningModel() {
                return pannerNode.panningModel;
            },
            set panningModel(value) {
                pannerNode.panningModel = value;
            },
            get positionX() {
                return positionXGainNode.gain;
            },
            get positionY() {
                return positionYGainNode.gain;
            },
            get positionZ() {
                return positionZGainNode.gain;
            },
            get refDistance() {
                return pannerNode.refDistance;
            },
            set refDistance(value) {
                // Bug #129: Safari does not throw an error yet.
                if (value < 0) {
                    throw new RangeError();
                }
                pannerNode.refDistance = value;
            },
            get rolloffFactor() {
                return pannerNode.rolloffFactor;
            },
            set rolloffFactor(value) {
                // Bug #130: Safari does not throw an error yet.
                if (value < 0) {
                    throw new RangeError();
                }
                pannerNode.rolloffFactor = value;
            },
            addEventListener(...args) {
                return inputGainNode.addEventListener(args[0], args[1], args[2]);
            },
            dispatchEvent(...args) {
                return inputGainNode.dispatchEvent(args[0]);
            },
            removeEventListener(...args) {
                return inputGainNode.removeEventListener(args[0], args[1], args[2]);
            }
        };
        if (coneInnerAngle !== nativePannerNodeFaker.coneInnerAngle) {
            nativePannerNodeFaker.coneInnerAngle = coneInnerAngle;
        }
        if (coneOuterAngle !== nativePannerNodeFaker.coneOuterAngle) {
            nativePannerNodeFaker.coneOuterAngle = coneOuterAngle;
        }
        if (coneOuterGain !== nativePannerNodeFaker.coneOuterGain) {
            nativePannerNodeFaker.coneOuterGain = coneOuterGain;
        }
        if (distanceModel !== nativePannerNodeFaker.distanceModel) {
            nativePannerNodeFaker.distanceModel = distanceModel;
        }
        if (maxDistance !== nativePannerNodeFaker.maxDistance) {
            nativePannerNodeFaker.maxDistance = maxDistance;
        }
        if (orientationX !== nativePannerNodeFaker.orientationX.value) {
            nativePannerNodeFaker.orientationX.value = orientationX;
        }
        if (orientationY !== nativePannerNodeFaker.orientationY.value) {
            nativePannerNodeFaker.orientationY.value = orientationY;
        }
        if (orientationZ !== nativePannerNodeFaker.orientationZ.value) {
            nativePannerNodeFaker.orientationZ.value = orientationZ;
        }
        if (panningModel !== nativePannerNodeFaker.panningModel) {
            nativePannerNodeFaker.panningModel = panningModel;
        }
        if (positionX !== nativePannerNodeFaker.positionX.value) {
            nativePannerNodeFaker.positionX.value = positionX;
        }
        if (positionY !== nativePannerNodeFaker.positionY.value) {
            nativePannerNodeFaker.positionY.value = positionY;
        }
        if (positionZ !== nativePannerNodeFaker.positionZ.value) {
            nativePannerNodeFaker.positionZ.value = positionZ;
        }
        if (refDistance !== nativePannerNodeFaker.refDistance) {
            nativePannerNodeFaker.refDistance = refDistance;
        }
        if (rolloffFactor !== nativePannerNodeFaker.rolloffFactor) {
            nativePannerNodeFaker.rolloffFactor = rolloffFactor;
        }
        if (lastOrientation[0] !== 1 || lastOrientation[1] !== 0 || lastOrientation[2] !== 0) {
            pannerNode.setOrientation(...lastOrientation); // tslint:disable-line:deprecation
        }
        if (lastPosition[0] !== 0 || lastPosition[1] !== 0 || lastPosition[2] !== 0) {
            pannerNode.setPosition(...lastPosition); // tslint:disable-line:deprecation
        }
        const whenConnected = () => {
            inputGainNode.connect(pannerNode);
            // Bug #119: Safari does not fully support the WaveShaperNode.
            connectNativeAudioNodeToNativeAudioNode(inputGainNode, waveShaperNode, 0, 0);
            waveShaperNode.connect(orientationXGainNode).connect(channelMergerNode, 0, 0);
            waveShaperNode.connect(orientationYGainNode).connect(channelMergerNode, 0, 1);
            waveShaperNode.connect(orientationZGainNode).connect(channelMergerNode, 0, 2);
            waveShaperNode.connect(positionXGainNode).connect(channelMergerNode, 0, 3);
            waveShaperNode.connect(positionYGainNode).connect(channelMergerNode, 0, 4);
            waveShaperNode.connect(positionZGainNode).connect(channelMergerNode, 0, 5);
            channelMergerNode.connect(scriptProcessorNode).connect(nativeContext.destination);
        };
        const whenDisconnected = () => {
            inputGainNode.disconnect(pannerNode);
            // Bug #119: Safari does not fully support the WaveShaperNode.
            disconnectNativeAudioNodeFromNativeAudioNode(inputGainNode, waveShaperNode, 0, 0);
            waveShaperNode.disconnect(orientationXGainNode);
            orientationXGainNode.disconnect(channelMergerNode);
            waveShaperNode.disconnect(orientationYGainNode);
            orientationYGainNode.disconnect(channelMergerNode);
            waveShaperNode.disconnect(orientationZGainNode);
            orientationZGainNode.disconnect(channelMergerNode);
            waveShaperNode.disconnect(positionXGainNode);
            positionXGainNode.disconnect(channelMergerNode);
            waveShaperNode.disconnect(positionYGainNode);
            positionYGainNode.disconnect(channelMergerNode);
            waveShaperNode.disconnect(positionZGainNode);
            positionZGainNode.disconnect(channelMergerNode);
            channelMergerNode.disconnect(scriptProcessorNode);
            scriptProcessorNode.disconnect(nativeContext.destination);
        };
        return monitorConnections(interceptConnections(nativePannerNodeFaker, pannerNode), whenConnected, whenDisconnected);
    };
};

const createNativePeriodicWaveFactory = (createIndexSizeError) => {
    return (nativeContext, { disableNormalization, imag, real }) => {
        // Bug #180: Safari does not allow to use ordinary arrays.
        const convertedImag = imag instanceof Float32Array ? imag : new Float32Array(imag);
        const convertedReal = real instanceof Float32Array ? real : new Float32Array(real);
        const nativePeriodicWave = nativeContext.createPeriodicWave(convertedReal, convertedImag, { disableNormalization });
        // Bug #181: Safari does not throw an IndexSizeError so far if the given arrays have less than two values.
        if (Array.from(imag).length < 2) {
            throw createIndexSizeError();
        }
        return nativePeriodicWave;
    };
};

const createNativeScriptProcessorNode = (nativeContext, bufferSize, numberOfInputChannels, numberOfOutputChannels) => {
    return nativeContext.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels); // tslint:disable-line deprecation
};

const createNativeStereoPannerNodeFactory = (createNativeStereoPannerNodeFaker, createNotSupportedError) => {
    return (nativeContext, options) => {
        const channelCountMode = options.channelCountMode;
        /*
         * Bug #105: The channelCountMode of 'clamped-max' should be supported. However it is not possible to write a polyfill for Safari
         * which supports it and therefore it can't be supported at all.
         */
        if (channelCountMode === 'clamped-max') {
            throw createNotSupportedError();
        }
        // Bug #105: Safari does not support the StereoPannerNode.
        if (nativeContext.createStereoPanner === undefined) {
            return createNativeStereoPannerNodeFaker(nativeContext, options);
        }
        const nativeStereoPannerNode = nativeContext.createStereoPanner();
        assignNativeAudioNodeOptions(nativeStereoPannerNode, options);
        assignNativeAudioNodeAudioParamValue(nativeStereoPannerNode, options, 'pan');
        /*
         * Bug #105: The channelCountMode of 'clamped-max' should be supported. However it is not possible to write a polyfill for Safari
         * which supports it and therefore it can't be supported at all.
         */
        Object.defineProperty(nativeStereoPannerNode, 'channelCountMode', {
            get: () => channelCountMode,
            set: (value) => {
                if (value !== channelCountMode) {
                    throw createNotSupportedError();
                }
            }
        });
        return nativeStereoPannerNode;
    };
};

const createNativeStereoPannerNodeFakerFactory = (createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeGainNode, createNativeWaveShaperNode, createNotSupportedError, monitorConnections) => {
    // The curve has a size of 14bit plus 1 value to have an exact representation for zero. This value has been determined experimentally.
    const CURVE_SIZE = 16385;
    const DC_CURVE = new Float32Array([1, 1]);
    const HALF_PI = Math.PI / 2;
    const SINGLE_CHANNEL_OPTIONS = { channelCount: 1, channelCountMode: 'explicit', channelInterpretation: 'discrete' };
    const SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS = { ...SINGLE_CHANNEL_OPTIONS, oversample: 'none' };
    const buildInternalGraphForMono = (nativeContext, inputGainNode, panGainNode, channelMergerNode) => {
        const leftWaveShaperCurve = new Float32Array(CURVE_SIZE);
        const rightWaveShaperCurve = new Float32Array(CURVE_SIZE);
        for (let i = 0; i < CURVE_SIZE; i += 1) {
            const x = (i / (CURVE_SIZE - 1)) * HALF_PI;
            leftWaveShaperCurve[i] = Math.cos(x);
            rightWaveShaperCurve[i] = Math.sin(x);
        }
        const leftGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 0 });
        // Bug #119: Safari does not fully support the WaveShaperNode.
        const leftWaveShaperNode = (createNativeWaveShaperNode(nativeContext, { ...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, curve: leftWaveShaperCurve }));
        // Bug #119: Safari does not fully support the WaveShaperNode.
        const panWaveShaperNode = (createNativeWaveShaperNode(nativeContext, { ...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, curve: DC_CURVE }));
        const rightGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 0 });
        // Bug #119: Safari does not fully support the WaveShaperNode.
        const rightWaveShaperNode = (createNativeWaveShaperNode(nativeContext, { ...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, curve: rightWaveShaperCurve }));
        return {
            connectGraph() {
                inputGainNode.connect(leftGainNode);
                inputGainNode.connect(panWaveShaperNode.inputs === undefined ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
                inputGainNode.connect(rightGainNode);
                panWaveShaperNode.connect(panGainNode);
                panGainNode.connect(leftWaveShaperNode.inputs === undefined ? leftWaveShaperNode : leftWaveShaperNode.inputs[0]);
                panGainNode.connect(rightWaveShaperNode.inputs === undefined ? rightWaveShaperNode : rightWaveShaperNode.inputs[0]);
                leftWaveShaperNode.connect(leftGainNode.gain);
                rightWaveShaperNode.connect(rightGainNode.gain);
                leftGainNode.connect(channelMergerNode, 0, 0);
                rightGainNode.connect(channelMergerNode, 0, 1);
            },
            disconnectGraph() {
                inputGainNode.disconnect(leftGainNode);
                inputGainNode.disconnect(panWaveShaperNode.inputs === undefined ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
                inputGainNode.disconnect(rightGainNode);
                panWaveShaperNode.disconnect(panGainNode);
                panGainNode.disconnect(leftWaveShaperNode.inputs === undefined ? leftWaveShaperNode : leftWaveShaperNode.inputs[0]);
                panGainNode.disconnect(rightWaveShaperNode.inputs === undefined ? rightWaveShaperNode : rightWaveShaperNode.inputs[0]);
                leftWaveShaperNode.disconnect(leftGainNode.gain);
                rightWaveShaperNode.disconnect(rightGainNode.gain);
                leftGainNode.disconnect(channelMergerNode, 0, 0);
                rightGainNode.disconnect(channelMergerNode, 0, 1);
            }
        };
    };
    const buildInternalGraphForStereo = (nativeContext, inputGainNode, panGainNode, channelMergerNode) => {
        const leftInputForLeftOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        const leftInputForRightOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        const rightInputForLeftOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        const rightInputForRightOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        const centerIndex = Math.floor(CURVE_SIZE / 2);
        for (let i = 0; i < CURVE_SIZE; i += 1) {
            if (i > centerIndex) {
                const x = ((i - centerIndex) / (CURVE_SIZE - 1 - centerIndex)) * HALF_PI;
                leftInputForLeftOutputWaveShaperCurve[i] = Math.cos(x);
                leftInputForRightOutputWaveShaperCurve[i] = Math.sin(x);
                rightInputForLeftOutputWaveShaperCurve[i] = 0;
                rightInputForRightOutputWaveShaperCurve[i] = 1;
            }
            else {
                const x = (i / (CURVE_SIZE - 1 - centerIndex)) * HALF_PI;
                leftInputForLeftOutputWaveShaperCurve[i] = 1;
                leftInputForRightOutputWaveShaperCurve[i] = 0;
                rightInputForLeftOutputWaveShaperCurve[i] = Math.cos(x);
                rightInputForRightOutputWaveShaperCurve[i] = Math.sin(x);
            }
        }
        const channelSplitterNode = createNativeChannelSplitterNode(nativeContext, {
            channelCount: 2,
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete',
            numberOfOutputs: 2
        });
        const leftInputForLeftOutputGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 0 });
        // Bug #119: Safari does not fully support the WaveShaperNode.
        const leftInputForLeftOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, {
            ...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
            curve: leftInputForLeftOutputWaveShaperCurve
        });
        const leftInputForRightOutputGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 0 });
        // Bug #119: Safari does not fully support the WaveShaperNode.
        const leftInputForRightOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, {
            ...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
            curve: leftInputForRightOutputWaveShaperCurve
        });
        // Bug #119: Safari does not fully support the WaveShaperNode.
        const panWaveShaperNode = (createNativeWaveShaperNode(nativeContext, { ...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, curve: DC_CURVE }));
        const rightInputForLeftOutputGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 0 });
        // Bug #119: Safari does not fully support the WaveShaperNode.
        const rightInputForLeftOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, {
            ...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
            curve: rightInputForLeftOutputWaveShaperCurve
        });
        const rightInputForRightOutputGainNode = createNativeGainNode(nativeContext, { ...SINGLE_CHANNEL_OPTIONS, gain: 0 });
        // Bug #119: Safari does not fully support the WaveShaperNode.
        const rightInputForRightOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, {
            ...SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS,
            curve: rightInputForRightOutputWaveShaperCurve
        });
        return {
            connectGraph() {
                inputGainNode.connect(channelSplitterNode);
                inputGainNode.connect(panWaveShaperNode.inputs === undefined ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
                channelSplitterNode.connect(leftInputForLeftOutputGainNode, 0);
                channelSplitterNode.connect(leftInputForRightOutputGainNode, 0);
                channelSplitterNode.connect(rightInputForLeftOutputGainNode, 1);
                channelSplitterNode.connect(rightInputForRightOutputGainNode, 1);
                panWaveShaperNode.connect(panGainNode);
                panGainNode.connect(leftInputForLeftOutputWaveShaperNode.inputs === undefined
                    ? leftInputForLeftOutputWaveShaperNode
                    : leftInputForLeftOutputWaveShaperNode.inputs[0]);
                panGainNode.connect(leftInputForRightOutputWaveShaperNode.inputs === undefined
                    ? leftInputForRightOutputWaveShaperNode
                    : leftInputForRightOutputWaveShaperNode.inputs[0]);
                panGainNode.connect(rightInputForLeftOutputWaveShaperNode.inputs === undefined
                    ? rightInputForLeftOutputWaveShaperNode
                    : rightInputForLeftOutputWaveShaperNode.inputs[0]);
                panGainNode.connect(rightInputForRightOutputWaveShaperNode.inputs === undefined
                    ? rightInputForRightOutputWaveShaperNode
                    : rightInputForRightOutputWaveShaperNode.inputs[0]);
                leftInputForLeftOutputWaveShaperNode.connect(leftInputForLeftOutputGainNode.gain);
                leftInputForRightOutputWaveShaperNode.connect(leftInputForRightOutputGainNode.gain);
                rightInputForLeftOutputWaveShaperNode.connect(rightInputForLeftOutputGainNode.gain);
                rightInputForRightOutputWaveShaperNode.connect(rightInputForRightOutputGainNode.gain);
                leftInputForLeftOutputGainNode.connect(channelMergerNode, 0, 0);
                rightInputForLeftOutputGainNode.connect(channelMergerNode, 0, 0);
                leftInputForRightOutputGainNode.connect(channelMergerNode, 0, 1);
                rightInputForRightOutputGainNode.connect(channelMergerNode, 0, 1);
            },
            disconnectGraph() {
                inputGainNode.disconnect(channelSplitterNode);
                inputGainNode.disconnect(panWaveShaperNode.inputs === undefined ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
                channelSplitterNode.disconnect(leftInputForLeftOutputGainNode, 0);
                channelSplitterNode.disconnect(leftInputForRightOutputGainNode, 0);
                channelSplitterNode.disconnect(rightInputForLeftOutputGainNode, 1);
                channelSplitterNode.disconnect(rightInputForRightOutputGainNode, 1);
                panWaveShaperNode.disconnect(panGainNode);
                panGainNode.disconnect(leftInputForLeftOutputWaveShaperNode.inputs === undefined
                    ? leftInputForLeftOutputWaveShaperNode
                    : leftInputForLeftOutputWaveShaperNode.inputs[0]);
                panGainNode.disconnect(leftInputForRightOutputWaveShaperNode.inputs === undefined
                    ? leftInputForRightOutputWaveShaperNode
                    : leftInputForRightOutputWaveShaperNode.inputs[0]);
                panGainNode.disconnect(rightInputForLeftOutputWaveShaperNode.inputs === undefined
                    ? rightInputForLeftOutputWaveShaperNode
                    : rightInputForLeftOutputWaveShaperNode.inputs[0]);
                panGainNode.disconnect(rightInputForRightOutputWaveShaperNode.inputs === undefined
                    ? rightInputForRightOutputWaveShaperNode
                    : rightInputForRightOutputWaveShaperNode.inputs[0]);
                leftInputForLeftOutputWaveShaperNode.disconnect(leftInputForLeftOutputGainNode.gain);
                leftInputForRightOutputWaveShaperNode.disconnect(leftInputForRightOutputGainNode.gain);
                rightInputForLeftOutputWaveShaperNode.disconnect(rightInputForLeftOutputGainNode.gain);
                rightInputForRightOutputWaveShaperNode.disconnect(rightInputForRightOutputGainNode.gain);
                leftInputForLeftOutputGainNode.disconnect(channelMergerNode, 0, 0);
                rightInputForLeftOutputGainNode.disconnect(channelMergerNode, 0, 0);
                leftInputForRightOutputGainNode.disconnect(channelMergerNode, 0, 1);
                rightInputForRightOutputGainNode.disconnect(channelMergerNode, 0, 1);
            }
        };
    };
    const buildInternalGraph = (nativeContext, channelCount, inputGainNode, panGainNode, channelMergerNode) => {
        if (channelCount === 1) {
            return buildInternalGraphForMono(nativeContext, inputGainNode, panGainNode, channelMergerNode);
        }
        if (channelCount === 2) {
            return buildInternalGraphForStereo(nativeContext, inputGainNode, panGainNode, channelMergerNode);
        }
        throw createNotSupportedError();
    };
    return (nativeContext, { channelCount, channelCountMode, pan, ...audioNodeOptions }) => {
        if (channelCountMode === 'max') {
            throw createNotSupportedError();
        }
        const channelMergerNode = createNativeChannelMergerNode(nativeContext, {
            ...audioNodeOptions,
            channelCount: 1,
            channelCountMode,
            numberOfInputs: 2
        });
        const inputGainNode = createNativeGainNode(nativeContext, { ...audioNodeOptions, channelCount, channelCountMode, gain: 1 });
        const panGainNode = createNativeGainNode(nativeContext, {
            channelCount: 1,
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete',
            gain: pan
        });
        let { connectGraph, disconnectGraph } = buildInternalGraph(nativeContext, channelCount, inputGainNode, panGainNode, channelMergerNode);
        Object.defineProperty(panGainNode.gain, 'defaultValue', { get: () => 0 });
        Object.defineProperty(panGainNode.gain, 'maxValue', { get: () => 1 });
        Object.defineProperty(panGainNode.gain, 'minValue', { get: () => -1 });
        const nativeStereoPannerNodeFakerFactory = {
            get bufferSize() {
                return undefined;
            },
            get channelCount() {
                return inputGainNode.channelCount;
            },
            set channelCount(value) {
                if (inputGainNode.channelCount !== value) {
                    if (isConnected) {
                        disconnectGraph();
                    }
                    ({ connectGraph, disconnectGraph } = buildInternalGraph(nativeContext, value, inputGainNode, panGainNode, channelMergerNode));
                    if (isConnected) {
                        connectGraph();
                    }
                }
                inputGainNode.channelCount = value;
            },
            get channelCountMode() {
                return inputGainNode.channelCountMode;
            },
            set channelCountMode(value) {
                if (value === 'clamped-max' || value === 'max') {
                    throw createNotSupportedError();
                }
                inputGainNode.channelCountMode = value;
            },
            get channelInterpretation() {
                return inputGainNode.channelInterpretation;
            },
            set channelInterpretation(value) {
                inputGainNode.channelInterpretation = value;
            },
            get context() {
                return inputGainNode.context;
            },
            get inputs() {
                return [inputGainNode];
            },
            get numberOfInputs() {
                return inputGainNode.numberOfInputs;
            },
            get numberOfOutputs() {
                return inputGainNode.numberOfOutputs;
            },
            get pan() {
                return panGainNode.gain;
            },
            addEventListener(...args) {
                return inputGainNode.addEventListener(args[0], args[1], args[2]);
            },
            dispatchEvent(...args) {
                return inputGainNode.dispatchEvent(args[0]);
            },
            removeEventListener(...args) {
                return inputGainNode.removeEventListener(args[0], args[1], args[2]);
            }
        };
        let isConnected = false;
        const whenConnected = () => {
            connectGraph();
            isConnected = true;
        };
        const whenDisconnected = () => {
            disconnectGraph();
            isConnected = false;
        };
        return monitorConnections(interceptConnections(nativeStereoPannerNodeFakerFactory, channelMergerNode), whenConnected, whenDisconnected);
    };
};

const createNativeWaveShaperNodeFactory = (createConnectedNativeAudioBufferSourceNode, createInvalidStateError, createNativeWaveShaperNodeFaker, isDCCurve, monitorConnections, nativeAudioContextConstructor, overwriteAccessors) => {
    return (nativeContext, options) => {
        const nativeWaveShaperNode = nativeContext.createWaveShaper();
        /*
         * Bug #119: Safari does not correctly map the values.
         * @todo Unfortunately there is no way to test for this behavior in a synchronous fashion which is why testing for the existence of
         * the webkitAudioContext is used as a workaround here. Testing for the automationRate property is necessary because this workaround
         * isn't necessary anymore since v14.0.2 of Safari.
         */
        if (nativeAudioContextConstructor !== null &&
            nativeAudioContextConstructor.name === 'webkitAudioContext' &&
            nativeContext.createGain().gain.automationRate === undefined) {
            return createNativeWaveShaperNodeFaker(nativeContext, options);
        }
        assignNativeAudioNodeOptions(nativeWaveShaperNode, options);
        const curve = options.curve === null || options.curve instanceof Float32Array ? options.curve : new Float32Array(options.curve);
        // Bug #104: Chrome, Edge and Opera will throw an InvalidAccessError when the curve has less than two samples.
        if (curve !== null && curve.length < 2) {
            throw createInvalidStateError();
        }
        // Only values of type Float32Array can be assigned to the curve property.
        assignNativeAudioNodeOption(nativeWaveShaperNode, { curve }, 'curve');
        assignNativeAudioNodeOption(nativeWaveShaperNode, options, 'oversample');
        let disconnectNativeAudioBufferSourceNode = null;
        let isConnected = false;
        overwriteAccessors(nativeWaveShaperNode, 'curve', (get) => () => get.call(nativeWaveShaperNode), (set) => (value) => {
            set.call(nativeWaveShaperNode, value);
            if (isConnected) {
                if (isDCCurve(value) && disconnectNativeAudioBufferSourceNode === null) {
                    disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode(nativeContext, nativeWaveShaperNode);
                }
                else if (!isDCCurve(value) && disconnectNativeAudioBufferSourceNode !== null) {
                    disconnectNativeAudioBufferSourceNode();
                    disconnectNativeAudioBufferSourceNode = null;
                }
            }
            return value;
        });
        const whenConnected = () => {
            isConnected = true;
            if (isDCCurve(nativeWaveShaperNode.curve)) {
                disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode(nativeContext, nativeWaveShaperNode);
            }
        };
        const whenDisconnected = () => {
            isConnected = false;
            if (disconnectNativeAudioBufferSourceNode !== null) {
                disconnectNativeAudioBufferSourceNode();
                disconnectNativeAudioBufferSourceNode = null;
            }
        };
        return monitorConnections(nativeWaveShaperNode, whenConnected, whenDisconnected);
    };
};

const createNativeWaveShaperNodeFakerFactory = (createConnectedNativeAudioBufferSourceNode, createInvalidStateError, createNativeGainNode, isDCCurve, monitorConnections) => {
    return (nativeContext, { curve, oversample, ...audioNodeOptions }) => {
        const negativeWaveShaperNode = nativeContext.createWaveShaper();
        const positiveWaveShaperNode = nativeContext.createWaveShaper();
        assignNativeAudioNodeOptions(negativeWaveShaperNode, audioNodeOptions);
        assignNativeAudioNodeOptions(positiveWaveShaperNode, audioNodeOptions);
        const inputGainNode = createNativeGainNode(nativeContext, { ...audioNodeOptions, gain: 1 });
        const invertGainNode = createNativeGainNode(nativeContext, { ...audioNodeOptions, gain: -1 });
        const outputGainNode = createNativeGainNode(nativeContext, { ...audioNodeOptions, gain: 1 });
        const revertGainNode = createNativeGainNode(nativeContext, { ...audioNodeOptions, gain: -1 });
        let disconnectNativeAudioBufferSourceNode = null;
        let isConnected = false;
        let unmodifiedCurve = null;
        const nativeWaveShaperNodeFaker = {
            get bufferSize() {
                return undefined;
            },
            get channelCount() {
                return negativeWaveShaperNode.channelCount;
            },
            set channelCount(value) {
                inputGainNode.channelCount = value;
                invertGainNode.channelCount = value;
                negativeWaveShaperNode.channelCount = value;
                outputGainNode.channelCount = value;
                positiveWaveShaperNode.channelCount = value;
                revertGainNode.channelCount = value;
            },
            get channelCountMode() {
                return negativeWaveShaperNode.channelCountMode;
            },
            set channelCountMode(value) {
                inputGainNode.channelCountMode = value;
                invertGainNode.channelCountMode = value;
                negativeWaveShaperNode.channelCountMode = value;
                outputGainNode.channelCountMode = value;
                positiveWaveShaperNode.channelCountMode = value;
                revertGainNode.channelCountMode = value;
            },
            get channelInterpretation() {
                return negativeWaveShaperNode.channelInterpretation;
            },
            set channelInterpretation(value) {
                inputGainNode.channelInterpretation = value;
                invertGainNode.channelInterpretation = value;
                negativeWaveShaperNode.channelInterpretation = value;
                outputGainNode.channelInterpretation = value;
                positiveWaveShaperNode.channelInterpretation = value;
                revertGainNode.channelInterpretation = value;
            },
            get context() {
                return negativeWaveShaperNode.context;
            },
            get curve() {
                return unmodifiedCurve;
            },
            set curve(value) {
                // Bug #102: Safari does not throw an InvalidStateError when the curve has less than two samples.
                if (value !== null && value.length < 2) {
                    throw createInvalidStateError();
                }
                if (value === null) {
                    negativeWaveShaperNode.curve = value;
                    positiveWaveShaperNode.curve = value;
                }
                else {
                    const curveLength = value.length;
                    const negativeCurve = new Float32Array(curveLength + 2 - (curveLength % 2));
                    const positiveCurve = new Float32Array(curveLength + 2 - (curveLength % 2));
                    negativeCurve[0] = value[0];
                    positiveCurve[0] = -value[curveLength - 1];
                    const length = Math.ceil((curveLength + 1) / 2);
                    const centerIndex = (curveLength + 1) / 2 - 1;
                    for (let i = 1; i < length; i += 1) {
                        const theoreticIndex = (i / length) * centerIndex;
                        const lowerIndex = Math.floor(theoreticIndex);
                        const upperIndex = Math.ceil(theoreticIndex);
                        negativeCurve[i] =
                            lowerIndex === upperIndex
                                ? value[lowerIndex]
                                : (1 - (theoreticIndex - lowerIndex)) * value[lowerIndex] +
                                    (1 - (upperIndex - theoreticIndex)) * value[upperIndex];
                        positiveCurve[i] =
                            lowerIndex === upperIndex
                                ? -value[curveLength - 1 - lowerIndex]
                                : -((1 - (theoreticIndex - lowerIndex)) * value[curveLength - 1 - lowerIndex]) -
                                    (1 - (upperIndex - theoreticIndex)) * value[curveLength - 1 - upperIndex];
                    }
                    negativeCurve[length] = curveLength % 2 === 1 ? value[length - 1] : (value[length - 2] + value[length - 1]) / 2;
                    negativeWaveShaperNode.curve = negativeCurve;
                    positiveWaveShaperNode.curve = positiveCurve;
                }
                unmodifiedCurve = value;
                if (isConnected) {
                    if (isDCCurve(unmodifiedCurve) && disconnectNativeAudioBufferSourceNode === null) {
                        disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode(nativeContext, inputGainNode);
                    }
                    else if (disconnectNativeAudioBufferSourceNode !== null) {
                        disconnectNativeAudioBufferSourceNode();
                        disconnectNativeAudioBufferSourceNode = null;
                    }
                }
            },
            get inputs() {
                return [inputGainNode];
            },
            get numberOfInputs() {
                return negativeWaveShaperNode.numberOfInputs;
            },
            get numberOfOutputs() {
                return negativeWaveShaperNode.numberOfOutputs;
            },
            get oversample() {
                return negativeWaveShaperNode.oversample;
            },
            set oversample(value) {
                negativeWaveShaperNode.oversample = value;
                positiveWaveShaperNode.oversample = value;
            },
            addEventListener(...args) {
                return inputGainNode.addEventListener(args[0], args[1], args[2]);
            },
            dispatchEvent(...args) {
                return inputGainNode.dispatchEvent(args[0]);
            },
            removeEventListener(...args) {
                return inputGainNode.removeEventListener(args[0], args[1], args[2]);
            }
        };
        if (curve !== null) {
            // Only values of type Float32Array can be assigned to the curve property.
            nativeWaveShaperNodeFaker.curve = curve instanceof Float32Array ? curve : new Float32Array(curve);
        }
        if (oversample !== nativeWaveShaperNodeFaker.oversample) {
            nativeWaveShaperNodeFaker.oversample = oversample;
        }
        const whenConnected = () => {
            inputGainNode.connect(negativeWaveShaperNode).connect(outputGainNode);
            inputGainNode.connect(invertGainNode).connect(positiveWaveShaperNode).connect(revertGainNode).connect(outputGainNode);
            isConnected = true;
            if (isDCCurve(unmodifiedCurve)) {
                disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode(nativeContext, inputGainNode);
            }
        };
        const whenDisconnected = () => {
            inputGainNode.disconnect(negativeWaveShaperNode);
            negativeWaveShaperNode.disconnect(outputGainNode);
            inputGainNode.disconnect(invertGainNode);
            invertGainNode.disconnect(positiveWaveShaperNode);
            positiveWaveShaperNode.disconnect(revertGainNode);
            revertGainNode.disconnect(outputGainNode);
            isConnected = false;
            if (disconnectNativeAudioBufferSourceNode !== null) {
                disconnectNativeAudioBufferSourceNode();
                disconnectNativeAudioBufferSourceNode = null;
            }
        };
        return monitorConnections(interceptConnections(nativeWaveShaperNodeFaker, outputGainNode), whenConnected, whenDisconnected);
    };
};

const createNotSupportedError = () => new DOMException('', 'NotSupportedError');

const DEFAULT_OPTIONS$e = {
    numberOfChannels: 1
};
const createOfflineAudioContextConstructor = (baseAudioContextConstructor, cacheTestResult, createInvalidStateError, createNativeOfflineAudioContext, startRendering) => {
    return class OfflineAudioContext extends baseAudioContextConstructor {
        constructor(a, b, c) {
            let options;
            if (typeof a === 'number' && b !== undefined && c !== undefined) {
                options = { length: b, numberOfChannels: a, sampleRate: c };
            }
            else if (typeof a === 'object') {
                options = a;
            }
            else {
                throw new Error('The given parameters are not valid.');
            }
            const { length, numberOfChannels, sampleRate } = { ...DEFAULT_OPTIONS$e, ...options };
            const nativeOfflineAudioContext = createNativeOfflineAudioContext(numberOfChannels, length, sampleRate);
            // #21 Safari does not support promises and therefore would fire the statechange event before the promise can be resolved.
            if (!cacheTestResult(testPromiseSupport, () => testPromiseSupport(nativeOfflineAudioContext))) {
                nativeOfflineAudioContext.addEventListener('statechange', (() => {
                    let i = 0;
                    const delayStateChangeEvent = (event) => {
                        if (this._state === 'running') {
                            if (i > 0) {
                                nativeOfflineAudioContext.removeEventListener('statechange', delayStateChangeEvent);
                                event.stopImmediatePropagation();
                                this._waitForThePromiseToSettle(event);
                            }
                            else {
                                i += 1;
                            }
                        }
                    };
                    return delayStateChangeEvent;
                })());
            }
            super(nativeOfflineAudioContext, numberOfChannels);
            this._length = length;
            this._nativeOfflineAudioContext = nativeOfflineAudioContext;
            this._state = null;
        }
        get length() {
            // Bug #17: Safari does not yet expose the length.
            if (this._nativeOfflineAudioContext.length === undefined) {
                return this._length;
            }
            return this._nativeOfflineAudioContext.length;
        }
        get state() {
            return this._state === null ? this._nativeOfflineAudioContext.state : this._state;
        }
        startRendering() {
            /*
             * Bug #9 & #59: It is theoretically possible that startRendering() will first render a partialOfflineAudioContext. Therefore
             * the state of the nativeOfflineAudioContext might no transition to running immediately.
             */
            if (this._state === 'running') {
                return Promise.reject(createInvalidStateError());
            }
            this._state = 'running';
            return startRendering(this.destination, this._nativeOfflineAudioContext).finally(() => {
                this._state = null;
                deactivateAudioGraph(this);
            });
        }
        _waitForThePromiseToSettle(event) {
            if (this._state === null) {
                this._nativeOfflineAudioContext.dispatchEvent(event);
            }
            else {
                setTimeout(() => this._waitForThePromiseToSettle(event));
            }
        }
    };
};

const DEFAULT_OPTIONS$f = {
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    detune: 0,
    frequency: 440,
    periodicWave: undefined,
    type: 'sine'
};
const createOscillatorNodeConstructor = (audioNodeConstructor, createAudioParam, createNativeOscillatorNode, createOscillatorNodeRenderer, getNativeContext, isNativeOfflineAudioContext, wrapEventListener) => {
    return class OscillatorNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$f, ...options };
            const nativeOscillatorNode = createNativeOscillatorNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const oscillatorNodeRenderer = (isOffline ? createOscillatorNodeRenderer() : null);
            const nyquist = context.sampleRate / 2;
            super(context, false, nativeOscillatorNode, oscillatorNodeRenderer);
            // Bug #81: Firefox & Safari do not export the correct values for maxValue and minValue.
            this._detune = createAudioParam(this, isOffline, nativeOscillatorNode.detune, 153600, -153600);
            // Bug #76: Safari does not export the correct values for maxValue and minValue.
            this._frequency = createAudioParam(this, isOffline, nativeOscillatorNode.frequency, nyquist, -nyquist);
            this._nativeOscillatorNode = nativeOscillatorNode;
            this._onended = null;
            this._oscillatorNodeRenderer = oscillatorNodeRenderer;
            if (this._oscillatorNodeRenderer !== null && mergedOptions.periodicWave !== undefined) {
                this._oscillatorNodeRenderer.periodicWave =
                    mergedOptions.periodicWave;
            }
        }
        get detune() {
            return this._detune;
        }
        get frequency() {
            return this._frequency;
        }
        get onended() {
            return this._onended;
        }
        set onended(value) {
            const wrappedListener = typeof value === 'function' ? wrapEventListener(this, value) : null;
            this._nativeOscillatorNode.onended = wrappedListener;
            const nativeOnEnded = this._nativeOscillatorNode.onended;
            this._onended = nativeOnEnded !== null && nativeOnEnded === wrappedListener ? value : nativeOnEnded;
        }
        get type() {
            return this._nativeOscillatorNode.type;
        }
        set type(value) {
            this._nativeOscillatorNode.type = value;
            if (this._oscillatorNodeRenderer !== null) {
                this._oscillatorNodeRenderer.periodicWave = null;
            }
        }
        setPeriodicWave(periodicWave) {
            this._nativeOscillatorNode.setPeriodicWave(periodicWave);
            if (this._oscillatorNodeRenderer !== null) {
                this._oscillatorNodeRenderer.periodicWave = periodicWave;
            }
        }
        start(when = 0) {
            this._nativeOscillatorNode.start(when);
            if (this._oscillatorNodeRenderer !== null) {
                this._oscillatorNodeRenderer.start = when;
            }
            if (this.context.state !== 'closed') {
                setInternalStateToActive(this);
                const resetInternalStateToPassive = () => {
                    this._nativeOscillatorNode.removeEventListener('ended', resetInternalStateToPassive);
                    if (isActiveAudioNode(this)) {
                        setInternalStateToPassive(this);
                    }
                };
                this._nativeOscillatorNode.addEventListener('ended', resetInternalStateToPassive);
            }
        }
        stop(when = 0) {
            this._nativeOscillatorNode.stop(when);
            if (this._oscillatorNodeRenderer !== null) {
                this._oscillatorNodeRenderer.stop = when;
            }
        }
    };
};

const createOscillatorNodeRendererFactory = (connectAudioParam, createNativeOscillatorNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeOscillatorNodes = new WeakMap();
        let periodicWave = null;
        let start = null;
        let stop = null;
        const createOscillatorNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeOscillatorNode = getNativeAudioNode(proxy);
            // If the initially used nativeOscillatorNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativeOscillatorNodeIsOwnedByContext = isOwnedByContext(nativeOscillatorNode, nativeOfflineAudioContext);
            if (!nativeOscillatorNodeIsOwnedByContext) {
                const options = {
                    channelCount: nativeOscillatorNode.channelCount,
                    channelCountMode: nativeOscillatorNode.channelCountMode,
                    channelInterpretation: nativeOscillatorNode.channelInterpretation,
                    detune: nativeOscillatorNode.detune.value,
                    frequency: nativeOscillatorNode.frequency.value,
                    periodicWave: periodicWave === null ? undefined : periodicWave,
                    type: nativeOscillatorNode.type
                };
                nativeOscillatorNode = createNativeOscillatorNode(nativeOfflineAudioContext, options);
                if (start !== null) {
                    nativeOscillatorNode.start(start);
                }
                if (stop !== null) {
                    nativeOscillatorNode.stop(stop);
                }
            }
            renderedNativeOscillatorNodes.set(nativeOfflineAudioContext, nativeOscillatorNode);
            if (!nativeOscillatorNodeIsOwnedByContext) {
                await renderAutomation(nativeOfflineAudioContext, proxy.detune, nativeOscillatorNode.detune);
                await renderAutomation(nativeOfflineAudioContext, proxy.frequency, nativeOscillatorNode.frequency);
            }
            else {
                await connectAudioParam(nativeOfflineAudioContext, proxy.detune, nativeOscillatorNode.detune);
                await connectAudioParam(nativeOfflineAudioContext, proxy.frequency, nativeOscillatorNode.frequency);
            }
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeOscillatorNode);
            return nativeOscillatorNode;
        };
        return {
            set periodicWave(value) {
                periodicWave = value;
            },
            set start(value) {
                start = value;
            },
            set stop(value) {
                stop = value;
            },
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeOscillatorNode = renderedNativeOscillatorNodes.get(nativeOfflineAudioContext);
                if (renderedNativeOscillatorNode !== undefined) {
                    return Promise.resolve(renderedNativeOscillatorNode);
                }
                return createOscillatorNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const DEFAULT_OPTIONS$g = {
    channelCount: 2,
    channelCountMode: 'clamped-max',
    channelInterpretation: 'speakers',
    coneInnerAngle: 360,
    coneOuterAngle: 360,
    coneOuterGain: 0,
    distanceModel: 'inverse',
    maxDistance: 10000,
    orientationX: 1,
    orientationY: 0,
    orientationZ: 0,
    panningModel: 'equalpower',
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    refDistance: 1,
    rolloffFactor: 1
};
const createPannerNodeConstructor = (audioNodeConstructor, createAudioParam, createNativePannerNode, createPannerNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) => {
    return class PannerNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$g, ...options };
            const nativePannerNode = createNativePannerNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const pannerNodeRenderer = (isOffline ? createPannerNodeRenderer() : null);
            super(context, false, nativePannerNode, pannerNodeRenderer);
            this._nativePannerNode = nativePannerNode;
            // Bug #74: Safari does not export the correct values for maxValue and minValue.
            this._orientationX = createAudioParam(this, isOffline, nativePannerNode.orientationX, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
            this._orientationY = createAudioParam(this, isOffline, nativePannerNode.orientationY, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
            this._orientationZ = createAudioParam(this, isOffline, nativePannerNode.orientationZ, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
            this._positionX = createAudioParam(this, isOffline, nativePannerNode.positionX, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
            this._positionY = createAudioParam(this, isOffline, nativePannerNode.positionY, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
            this._positionZ = createAudioParam(this, isOffline, nativePannerNode.positionZ, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
            // @todo Determine a meaningful tail-time instead of just using one second.
            setAudioNodeTailTime(this, 1);
        }
        get coneInnerAngle() {
            return this._nativePannerNode.coneInnerAngle;
        }
        set coneInnerAngle(value) {
            this._nativePannerNode.coneInnerAngle = value;
        }
        get coneOuterAngle() {
            return this._nativePannerNode.coneOuterAngle;
        }
        set coneOuterAngle(value) {
            this._nativePannerNode.coneOuterAngle = value;
        }
        get coneOuterGain() {
            return this._nativePannerNode.coneOuterGain;
        }
        set coneOuterGain(value) {
            this._nativePannerNode.coneOuterGain = value;
        }
        get distanceModel() {
            return this._nativePannerNode.distanceModel;
        }
        set distanceModel(value) {
            this._nativePannerNode.distanceModel = value;
        }
        get maxDistance() {
            return this._nativePannerNode.maxDistance;
        }
        set maxDistance(value) {
            this._nativePannerNode.maxDistance = value;
        }
        get orientationX() {
            return this._orientationX;
        }
        get orientationY() {
            return this._orientationY;
        }
        get orientationZ() {
            return this._orientationZ;
        }
        get panningModel() {
            return this._nativePannerNode.panningModel;
        }
        set panningModel(value) {
            this._nativePannerNode.panningModel = value;
        }
        get positionX() {
            return this._positionX;
        }
        get positionY() {
            return this._positionY;
        }
        get positionZ() {
            return this._positionZ;
        }
        get refDistance() {
            return this._nativePannerNode.refDistance;
        }
        set refDistance(value) {
            this._nativePannerNode.refDistance = value;
        }
        get rolloffFactor() {
            return this._nativePannerNode.rolloffFactor;
        }
        set rolloffFactor(value) {
            this._nativePannerNode.rolloffFactor = value;
        }
    };
};

const createPannerNodeRendererFactory = (connectAudioParam, createNativeChannelMergerNode, createNativeConstantSourceNode, createNativeGainNode, createNativePannerNode, getNativeAudioNode, nativeOfflineAudioContextConstructor, renderAutomation, renderInputsOfAudioNode, renderNativeOfflineAudioContext) => {
    return () => {
        const renderedNativeAudioNodes = new WeakMap();
        let renderedBufferPromise = null;
        const createAudioNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeGainNode = null;
            let nativePannerNode = getNativeAudioNode(proxy);
            const commonAudioNodeOptions = {
                channelCount: nativePannerNode.channelCount,
                channelCountMode: nativePannerNode.channelCountMode,
                channelInterpretation: nativePannerNode.channelInterpretation
            };
            const commonNativePannerNodeOptions = {
                ...commonAudioNodeOptions,
                coneInnerAngle: nativePannerNode.coneInnerAngle,
                coneOuterAngle: nativePannerNode.coneOuterAngle,
                coneOuterGain: nativePannerNode.coneOuterGain,
                distanceModel: nativePannerNode.distanceModel,
                maxDistance: nativePannerNode.maxDistance,
                panningModel: nativePannerNode.panningModel,
                refDistance: nativePannerNode.refDistance,
                rolloffFactor: nativePannerNode.rolloffFactor
            };
            // If the initially used nativePannerNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativePannerNodeIsOwnedByContext = isOwnedByContext(nativePannerNode, nativeOfflineAudioContext);
            // Bug #124: Safari does not support modifying the orientation and the position with AudioParams.
            if ('bufferSize' in nativePannerNode) {
                nativeGainNode = createNativeGainNode(nativeOfflineAudioContext, { ...commonAudioNodeOptions, gain: 1 });
            }
            else if (!nativePannerNodeIsOwnedByContext) {
                const options = {
                    ...commonNativePannerNodeOptions,
                    orientationX: nativePannerNode.orientationX.value,
                    orientationY: nativePannerNode.orientationY.value,
                    orientationZ: nativePannerNode.orientationZ.value,
                    positionX: nativePannerNode.positionX.value,
                    positionY: nativePannerNode.positionY.value,
                    positionZ: nativePannerNode.positionZ.value
                };
                nativePannerNode = createNativePannerNode(nativeOfflineAudioContext, options);
            }
            renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeGainNode === null ? nativePannerNode : nativeGainNode);
            if (nativeGainNode !== null) {
                if (renderedBufferPromise === null) {
                    if (nativeOfflineAudioContextConstructor === null) {
                        throw new Error('Missing the native OfflineAudioContext constructor.');
                    }
                    const partialOfflineAudioContext = new nativeOfflineAudioContextConstructor(6, 
                    // Bug #17: Safari does not yet expose the length.
                    proxy.context.length, nativeOfflineAudioContext.sampleRate);
                    const nativeChannelMergerNode = createNativeChannelMergerNode(partialOfflineAudioContext, {
                        channelCount: 1,
                        channelCountMode: 'explicit',
                        channelInterpretation: 'speakers',
                        numberOfInputs: 6
                    });
                    nativeChannelMergerNode.connect(partialOfflineAudioContext.destination);
                    renderedBufferPromise = (async () => {
                        const nativeConstantSourceNodes = await Promise.all([
                            proxy.orientationX,
                            proxy.orientationY,
                            proxy.orientationZ,
                            proxy.positionX,
                            proxy.positionY,
                            proxy.positionZ
                        ].map(async (audioParam, index) => {
                            const nativeConstantSourceNode = createNativeConstantSourceNode(partialOfflineAudioContext, {
                                channelCount: 1,
                                channelCountMode: 'explicit',
                                channelInterpretation: 'discrete',
                                offset: index === 0 ? 1 : 0
                            });
                            await renderAutomation(partialOfflineAudioContext, audioParam, nativeConstantSourceNode.offset);
                            return nativeConstantSourceNode;
                        }));
                        for (let i = 0; i < 6; i += 1) {
                            nativeConstantSourceNodes[i].connect(nativeChannelMergerNode, 0, i);
                            nativeConstantSourceNodes[i].start(0);
                        }
                        return renderNativeOfflineAudioContext(partialOfflineAudioContext);
                    })();
                }
                const renderedBuffer = await renderedBufferPromise;
                const inputGainNode = createNativeGainNode(nativeOfflineAudioContext, { ...commonAudioNodeOptions, gain: 1 });
                await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, inputGainNode);
                const channelDatas = [];
                for (let i = 0; i < renderedBuffer.numberOfChannels; i += 1) {
                    channelDatas.push(renderedBuffer.getChannelData(i));
                }
                let lastOrientation = [channelDatas[0][0], channelDatas[1][0], channelDatas[2][0]];
                let lastPosition = [channelDatas[3][0], channelDatas[4][0], channelDatas[5][0]];
                let gateGainNode = createNativeGainNode(nativeOfflineAudioContext, { ...commonAudioNodeOptions, gain: 1 });
                let partialPannerNode = createNativePannerNode(nativeOfflineAudioContext, {
                    ...commonNativePannerNodeOptions,
                    orientationX: lastOrientation[0],
                    orientationY: lastOrientation[1],
                    orientationZ: lastOrientation[2],
                    positionX: lastPosition[0],
                    positionY: lastPosition[1],
                    positionZ: lastPosition[2]
                });
                inputGainNode.connect(gateGainNode).connect(partialPannerNode.inputs[0]);
                partialPannerNode.connect(nativeGainNode);
                for (let i = 128; i < renderedBuffer.length; i += 128) {
                    const orientation = [channelDatas[0][i], channelDatas[1][i], channelDatas[2][i]];
                    const positon = [channelDatas[3][i], channelDatas[4][i], channelDatas[5][i]];
                    if (orientation.some((value, index) => value !== lastOrientation[index]) ||
                        positon.some((value, index) => value !== lastPosition[index])) {
                        lastOrientation = orientation;
                        lastPosition = positon;
                        const currentTime = i / nativeOfflineAudioContext.sampleRate;
                        gateGainNode.gain.setValueAtTime(0, currentTime);
                        gateGainNode = createNativeGainNode(nativeOfflineAudioContext, { ...commonAudioNodeOptions, gain: 0 });
                        partialPannerNode = createNativePannerNode(nativeOfflineAudioContext, {
                            ...commonNativePannerNodeOptions,
                            orientationX: lastOrientation[0],
                            orientationY: lastOrientation[1],
                            orientationZ: lastOrientation[2],
                            positionX: lastPosition[0],
                            positionY: lastPosition[1],
                            positionZ: lastPosition[2]
                        });
                        gateGainNode.gain.setValueAtTime(1, currentTime);
                        inputGainNode.connect(gateGainNode).connect(partialPannerNode.inputs[0]);
                        partialPannerNode.connect(nativeGainNode);
                    }
                }
                return nativeGainNode;
            }
            if (!nativePannerNodeIsOwnedByContext) {
                await renderAutomation(nativeOfflineAudioContext, proxy.orientationX, nativePannerNode.orientationX);
                await renderAutomation(nativeOfflineAudioContext, proxy.orientationY, nativePannerNode.orientationY);
                await renderAutomation(nativeOfflineAudioContext, proxy.orientationZ, nativePannerNode.orientationZ);
                await renderAutomation(nativeOfflineAudioContext, proxy.positionX, nativePannerNode.positionX);
                await renderAutomation(nativeOfflineAudioContext, proxy.positionY, nativePannerNode.positionY);
                await renderAutomation(nativeOfflineAudioContext, proxy.positionZ, nativePannerNode.positionZ);
            }
            else {
                await connectAudioParam(nativeOfflineAudioContext, proxy.orientationX, nativePannerNode.orientationX);
                await connectAudioParam(nativeOfflineAudioContext, proxy.orientationY, nativePannerNode.orientationY);
                await connectAudioParam(nativeOfflineAudioContext, proxy.orientationZ, nativePannerNode.orientationZ);
                await connectAudioParam(nativeOfflineAudioContext, proxy.positionX, nativePannerNode.positionX);
                await connectAudioParam(nativeOfflineAudioContext, proxy.positionY, nativePannerNode.positionY);
                await connectAudioParam(nativeOfflineAudioContext, proxy.positionZ, nativePannerNode.positionZ);
            }
            if (isNativeAudioNodeFaker(nativePannerNode)) {
                await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativePannerNode.inputs[0]);
            }
            else {
                await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativePannerNode);
            }
            return nativePannerNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeGainNodeOrNativePannerNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);
                if (renderedNativeGainNodeOrNativePannerNode !== undefined) {
                    return Promise.resolve(renderedNativeGainNodeOrNativePannerNode);
                }
                return createAudioNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const DEFAULT_OPTIONS$h = {
    disableNormalization: false
};
const createPeriodicWaveConstructor = (createNativePeriodicWave, getNativeContext, periodicWaveStore, sanitizePeriodicWaveOptions) => {
    return class PeriodicWave {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = sanitizePeriodicWaveOptions({ ...DEFAULT_OPTIONS$h, ...options });
            const periodicWave = createNativePeriodicWave(nativeContext, mergedOptions);
            periodicWaveStore.add(periodicWave);
            // This does violate all good pratices but it is used here to simplify the handling of periodic waves.
            return periodicWave;
        }
        static [Symbol.hasInstance](instance) {
            return ((instance !== null && typeof instance === 'object' && Object.getPrototypeOf(instance) === PeriodicWave.prototype) ||
                periodicWaveStore.has(instance));
        }
    };
};

const createRenderAutomation = (getAudioParamRenderer, renderInputsOfAudioParam) => {
    return (nativeOfflineAudioContext, audioParam, nativeAudioParam) => {
        const audioParamRenderer = getAudioParamRenderer(audioParam);
        audioParamRenderer.replay(nativeAudioParam);
        return renderInputsOfAudioParam(audioParam, nativeOfflineAudioContext, nativeAudioParam);
    };
};

const createRenderInputsOfAudioNode = (getAudioNodeConnections, getAudioNodeRenderer, isPartOfACycle) => {
    return async (audioNode, nativeOfflineAudioContext, nativeAudioNode) => {
        const audioNodeConnections = getAudioNodeConnections(audioNode);
        await Promise.all(audioNodeConnections.activeInputs
            .map((connections, input) => Array.from(connections).map(async ([source, output]) => {
            const audioNodeRenderer = getAudioNodeRenderer(source);
            const renderedNativeAudioNode = await audioNodeRenderer.render(source, nativeOfflineAudioContext);
            const destination = audioNode.context.destination;
            if (!isPartOfACycle(source) && (audioNode !== destination || !isPartOfACycle(audioNode))) {
                renderedNativeAudioNode.connect(nativeAudioNode, output, input);
            }
        }))
            .reduce((allRenderingPromises, renderingPromises) => [...allRenderingPromises, ...renderingPromises], []));
    };
};

const createRenderInputsOfAudioParam = (getAudioNodeRenderer, getAudioParamConnections, isPartOfACycle) => {
    return async (audioParam, nativeOfflineAudioContext, nativeAudioParam) => {
        const audioParamConnections = getAudioParamConnections(audioParam);
        await Promise.all(Array.from(audioParamConnections.activeInputs).map(async ([source, output]) => {
            const audioNodeRenderer = getAudioNodeRenderer(source);
            const renderedNativeAudioNode = await audioNodeRenderer.render(source, nativeOfflineAudioContext);
            if (!isPartOfACycle(source)) {
                renderedNativeAudioNode.connect(nativeAudioParam, output);
            }
        }));
    };
};

const createRenderNativeOfflineAudioContext = (cacheTestResult, createNativeGainNode, createNativeScriptProcessorNode, testOfflineAudioContextCurrentTimeSupport) => {
    return (nativeOfflineAudioContext) => {
        // Bug #21: Safari does not support promises yet.
        if (cacheTestResult(testPromiseSupport, () => testPromiseSupport(nativeOfflineAudioContext))) {
            // Bug #158: Chrome and Edge do not advance currentTime if it is not accessed while rendering the audio.
            return Promise.resolve(cacheTestResult(testOfflineAudioContextCurrentTimeSupport, testOfflineAudioContextCurrentTimeSupport)).then((isOfflineAudioContextCurrentTimeSupported) => {
                if (!isOfflineAudioContextCurrentTimeSupported) {
                    const scriptProcessorNode = createNativeScriptProcessorNode(nativeOfflineAudioContext, 512, 0, 1);
                    nativeOfflineAudioContext.oncomplete = () => {
                        scriptProcessorNode.onaudioprocess = null; // tslint:disable-line:deprecation
                        scriptProcessorNode.disconnect();
                    };
                    scriptProcessorNode.onaudioprocess = () => nativeOfflineAudioContext.currentTime; // tslint:disable-line:deprecation
                    scriptProcessorNode.connect(nativeOfflineAudioContext.destination);
                }
                return nativeOfflineAudioContext.startRendering();
            });
        }
        return new Promise((resolve) => {
            // Bug #48: Safari does not render an OfflineAudioContext without any connected node.
            const gainNode = createNativeGainNode(nativeOfflineAudioContext, {
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'discrete',
                gain: 0
            });
            nativeOfflineAudioContext.oncomplete = (event) => {
                gainNode.disconnect();
                resolve(event.renderedBuffer);
            };
            gainNode.connect(nativeOfflineAudioContext.destination);
            nativeOfflineAudioContext.startRendering();
        });
    };
};

const createSetActiveAudioWorkletNodeInputs = (activeAudioWorkletNodeInputsStore) => {
    return (nativeAudioWorkletNode, activeInputs) => {
        activeAudioWorkletNodeInputsStore.set(nativeAudioWorkletNode, activeInputs);
    };
};

const createSetAudioNodeTailTime = (audioNodeTailTimeStore) => {
    return (audioNode, tailTime) => audioNodeTailTimeStore.set(audioNode, tailTime);
};

const createStartRendering = (audioBufferStore, cacheTestResult, getAudioNodeRenderer, getUnrenderedAudioWorkletNodes, renderNativeOfflineAudioContext, testAudioBufferCopyChannelMethodsOutOfBoundsSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds) => {
    return (destination, nativeOfflineAudioContext) => getAudioNodeRenderer(destination)
        .render(destination, nativeOfflineAudioContext)
        /*
         * Bug #86 & #87: Invoking the renderer of an AudioWorkletNode might be necessary if it has no direct or indirect connection to the
         * destination.
         */
        .then(() => Promise.all(Array.from(getUnrenderedAudioWorkletNodes(nativeOfflineAudioContext)).map((audioWorkletNode) => getAudioNodeRenderer(audioWorkletNode).render(audioWorkletNode, nativeOfflineAudioContext))))
        .then(() => renderNativeOfflineAudioContext(nativeOfflineAudioContext))
        .then((audioBuffer) => {
        // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
        // Bug #100: Safari does throw a wrong error when calling getChannelData() with an out-of-bounds value.
        if (typeof audioBuffer.copyFromChannel !== 'function') {
            wrapAudioBufferCopyChannelMethods(audioBuffer);
            wrapAudioBufferGetChannelDataMethod(audioBuffer);
            // Bug #157: Firefox does not allow the bufferOffset to be out-of-bounds.
        }
        else if (!cacheTestResult(testAudioBufferCopyChannelMethodsOutOfBoundsSupport, () => testAudioBufferCopyChannelMethodsOutOfBoundsSupport(audioBuffer))) {
            wrapAudioBufferCopyChannelMethodsOutOfBounds(audioBuffer);
        }
        audioBufferStore.add(audioBuffer);
        return audioBuffer;
    });
};

const DEFAULT_OPTIONS$i = {
    channelCount: 2,
    /*
     * Bug #105: The channelCountMode should be 'clamped-max' according to the spec but is set to 'explicit' to achieve consistent
     * behavior.
     */
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
    pan: 0
};
const createStereoPannerNodeConstructor = (audioNodeConstructor, createAudioParam, createNativeStereoPannerNode, createStereoPannerNodeRenderer, getNativeContext, isNativeOfflineAudioContext) => {
    return class StereoPannerNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$i, ...options };
            const nativeStereoPannerNode = createNativeStereoPannerNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const stereoPannerNodeRenderer = (isOffline ? createStereoPannerNodeRenderer() : null);
            super(context, false, nativeStereoPannerNode, stereoPannerNodeRenderer);
            this._pan = createAudioParam(this, isOffline, nativeStereoPannerNode.pan);
        }
        get pan() {
            return this._pan;
        }
    };
};

const createStereoPannerNodeRendererFactory = (connectAudioParam, createNativeStereoPannerNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeStereoPannerNodes = new WeakMap();
        const createStereoPannerNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeStereoPannerNode = getNativeAudioNode(proxy);
            /*
             * If the initially used nativeStereoPannerNode was not constructed on the same OfflineAudioContext it needs to be created
             * again.
             */
            const nativeStereoPannerNodeIsOwnedByContext = isOwnedByContext(nativeStereoPannerNode, nativeOfflineAudioContext);
            if (!nativeStereoPannerNodeIsOwnedByContext) {
                const options = {
                    channelCount: nativeStereoPannerNode.channelCount,
                    channelCountMode: nativeStereoPannerNode.channelCountMode,
                    channelInterpretation: nativeStereoPannerNode.channelInterpretation,
                    pan: nativeStereoPannerNode.pan.value
                };
                nativeStereoPannerNode = createNativeStereoPannerNode(nativeOfflineAudioContext, options);
            }
            renderedNativeStereoPannerNodes.set(nativeOfflineAudioContext, nativeStereoPannerNode);
            if (!nativeStereoPannerNodeIsOwnedByContext) {
                await renderAutomation(nativeOfflineAudioContext, proxy.pan, nativeStereoPannerNode.pan);
            }
            else {
                await connectAudioParam(nativeOfflineAudioContext, proxy.pan, nativeStereoPannerNode.pan);
            }
            if (isNativeAudioNodeFaker(nativeStereoPannerNode)) {
                await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeStereoPannerNode.inputs[0]);
            }
            else {
                await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeStereoPannerNode);
            }
            return nativeStereoPannerNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeStereoPannerNode = renderedNativeStereoPannerNodes.get(nativeOfflineAudioContext);
                if (renderedNativeStereoPannerNode !== undefined) {
                    return Promise.resolve(renderedNativeStereoPannerNode);
                }
                return createStereoPannerNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

// Bug #33: Safari exposes an AudioBuffer but it can't be used as a constructor.
const createTestAudioBufferConstructorSupport = (nativeAudioBufferConstructor) => {
    return () => {
        if (nativeAudioBufferConstructor === null) {
            return false;
        }
        try {
            new nativeAudioBufferConstructor({ length: 1, sampleRate: 44100 }); // tslint:disable-line:no-unused-expression
        }
        catch {
            return false;
        }
        return true;
    };
};

/*
 * Firefox up to version 67 didn't fully support the copyFromChannel() and copyToChannel() methods. Therefore testing one of those methods
 * is enough to know if the other one is supported as well.
 */
const createTestAudioBufferCopyChannelMethodsSubarraySupport = (nativeOfflineAudioContextConstructor) => {
    return () => {
        if (nativeOfflineAudioContextConstructor === null) {
            return false;
        }
        const nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        const nativeAudioBuffer = nativeOfflineAudioContext.createBuffer(1, 1, 44100);
        // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
        if (nativeAudioBuffer.copyToChannel === undefined) {
            return true;
        }
        const source = new Float32Array(2);
        try {
            nativeAudioBuffer.copyFromChannel(source, 0, 0);
        }
        catch {
            return false;
        }
        return true;
    };
};

const createTestAudioContextCloseMethodSupport = (nativeAudioContextConstructor) => {
    return () => {
        if (nativeAudioContextConstructor === null) {
            return false;
        }
        // Try to check the prototype before constructing the AudioContext.
        if (nativeAudioContextConstructor.prototype !== undefined && nativeAudioContextConstructor.prototype.close !== undefined) {
            return true;
        }
        const audioContext = new nativeAudioContextConstructor();
        const isAudioContextClosable = audioContext.close !== undefined;
        try {
            audioContext.close();
        }
        catch {
            // Ignore errors.
        }
        return isAudioContextClosable;
    };
};

/**
 * Edge up to version 14, Firefox up to version 52, Safari up to version 9 and maybe other browsers
 * did not refuse to decode invalid parameters with a TypeError.
 */
const createTestAudioContextDecodeAudioDataMethodTypeErrorSupport = (nativeOfflineAudioContextConstructor) => {
    return () => {
        if (nativeOfflineAudioContextConstructor === null) {
            return Promise.resolve(false);
        }
        const offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        // Bug #21: Safari does not support promises yet.
        return new Promise((resolve) => {
            let isPending = true;
            const resolvePromise = (err) => {
                if (isPending) {
                    isPending = false;
                    offlineAudioContext.startRendering();
                    resolve(err instanceof TypeError);
                }
            };
            let promise;
            // Bug #26: Safari throws a synchronous error.
            try {
                promise = offlineAudioContext
                    // Bug #1: Safari requires a successCallback.
                    .decodeAudioData(null, () => {
                    // Ignore the success callback.
                }, resolvePromise);
            }
            catch (err) {
                resolvePromise(err);
            }
            // Bug #21: Safari does not support promises yet.
            if (promise !== undefined) {
                // Bug #6: Chrome, Edge, Firefox and Opera do not call the errorCallback.
                promise.catch(resolvePromise);
            }
        });
    };
};

const createTestAudioContextOptionsSupport = (nativeAudioContextConstructor) => {
    return () => {
        if (nativeAudioContextConstructor === null) {
            return false;
        }
        let audioContext;
        try {
            audioContext = new nativeAudioContextConstructor({ latencyHint: 'balanced' });
        }
        catch {
            return false;
        }
        audioContext.close();
        return true;
    };
};

// Safari up to version 12.0 (but not v12.1) didn't return the destination in case it was an AudioNode.
const createTestAudioNodeConnectMethodSupport = (nativeOfflineAudioContextConstructor) => {
    return () => {
        if (nativeOfflineAudioContextConstructor === null) {
            return false;
        }
        const nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        const nativeGainNode = nativeOfflineAudioContext.createGain();
        const isSupported = nativeGainNode.connect(nativeGainNode) === nativeGainNode;
        nativeGainNode.disconnect(nativeGainNode);
        return isSupported;
    };
};

/**
 * Chrome version 66 and 67 did not call the process() function of an AudioWorkletProcessor if it had no outputs. AudioWorklet support was
 * enabled by default in version 66.
 */
const createTestAudioWorkletProcessorNoOutputsSupport = (nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor) => {
    return async () => {
        // Bug #61: If there is no native AudioWorkletNode it gets faked and therefore it is no problem if the it doesn't exist.
        if (nativeAudioWorkletNodeConstructor === null) {
            return true;
        }
        if (nativeOfflineAudioContextConstructor === null) {
            return false;
        }
        const blob = new Blob([
            'let c,p;class A extends AudioWorkletProcessor{constructor(){super();this.port.onmessage=(e)=>{p=e.data;p.onmessage=()=>{p.postMessage(c);p.close()};this.port.postMessage(0)}}process(){c=1}}registerProcessor("a",A)'
        ], {
            type: 'application/javascript; charset=utf-8'
        });
        const messageChannel = new MessageChannel();
        // Bug #141: Safari does not support creating an OfflineAudioContext with less than 44100 Hz.
        const offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 128, 44100);
        const url = URL.createObjectURL(blob);
        let isCallingProcess = false;
        try {
            await offlineAudioContext.audioWorklet.addModule(url);
            const audioWorkletNode = new nativeAudioWorkletNodeConstructor(offlineAudioContext, 'a', { numberOfOutputs: 0 });
            const oscillator = offlineAudioContext.createOscillator();
            await new Promise((resolve) => {
                audioWorkletNode.port.onmessage = () => resolve();
                audioWorkletNode.port.postMessage(messageChannel.port2, [messageChannel.port2]);
            });
            audioWorkletNode.port.onmessage = () => (isCallingProcess = true);
            oscillator.connect(audioWorkletNode);
            oscillator.start(0);
            await offlineAudioContext.startRendering();
            isCallingProcess = await new Promise((resolve) => {
                messageChannel.port1.onmessage = ({ data }) => resolve(data === 1);
                messageChannel.port1.postMessage(0);
            });
        }
        catch {
            // Ignore errors.
        }
        finally {
            messageChannel.port1.close();
            URL.revokeObjectURL(url);
        }
        return isCallingProcess;
    };
};

// Bug #179: Firefox does not allow to transfer any buffer which has been passed to the process() method as an argument.
const createTestAudioWorkletProcessorPostMessageSupport = (nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor) => {
    return async () => {
        // Bug #61: If there is no native AudioWorkletNode it gets faked and therefore it is no problem if the it doesn't exist.
        if (nativeAudioWorkletNodeConstructor === null) {
            return true;
        }
        if (nativeOfflineAudioContextConstructor === null) {
            return false;
        }
        const blob = new Blob(['class A extends AudioWorkletProcessor{process(i){this.port.postMessage(i,[i[0][0].buffer])}}registerProcessor("a",A)'], {
            type: 'application/javascript; charset=utf-8'
        });
        // Bug #141: Safari does not support creating an OfflineAudioContext with less than 44100 Hz.
        const offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 128, 44100);
        const url = URL.createObjectURL(blob);
        let isEmittingMessageEvents = false;
        let isEmittingProcessorErrorEvents = false;
        try {
            await offlineAudioContext.audioWorklet.addModule(url);
            const audioWorkletNode = new nativeAudioWorkletNodeConstructor(offlineAudioContext, 'a', { numberOfOutputs: 0 });
            const oscillator = offlineAudioContext.createOscillator();
            audioWorkletNode.port.onmessage = () => (isEmittingMessageEvents = true);
            audioWorkletNode.onprocessorerror = () => (isEmittingProcessorErrorEvents = true);
            oscillator.connect(audioWorkletNode);
            oscillator.start(0);
            await offlineAudioContext.startRendering();
        }
        catch {
            // Ignore errors.
        }
        finally {
            URL.revokeObjectURL(url);
        }
        return isEmittingMessageEvents && !isEmittingProcessorErrorEvents;
    };
};

/**
 * Firefox up to version 69 did not throw an error when setting a different channelCount or channelCountMode.
 */
const createTestChannelMergerNodeChannelCountSupport = (nativeOfflineAudioContextConstructor) => {
    return () => {
        if (nativeOfflineAudioContextConstructor === null) {
            return false;
        }
        const offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        const nativeChannelMergerNode = offlineAudioContext.createChannelMerger();
        /**
         * Bug #15: Safari does not return the default properties. It still needs to be patched. This test is supposed to test the support
         * in other browsers.
         */
        if (nativeChannelMergerNode.channelCountMode === 'max') {
            return true;
        }
        try {
            nativeChannelMergerNode.channelCount = 2;
        }
        catch {
            return true;
        }
        return false;
    };
};

const createTestConstantSourceNodeAccurateSchedulingSupport = (nativeOfflineAudioContextConstructor) => {
    return () => {
        if (nativeOfflineAudioContextConstructor === null) {
            return false;
        }
        const nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        // Bug #62: Safari does not support ConstantSourceNodes.
        if (nativeOfflineAudioContext.createConstantSource === undefined) {
            return true;
        }
        const nativeConstantSourceNode = nativeOfflineAudioContext.createConstantSource();
        /*
         * @todo This is using bug #75 to detect bug #70. That works because both bugs were unique to
         * the implementation of Firefox right now, but it could probably be done in a better way.
         */
        return nativeConstantSourceNode.offset.maxValue !== Number.POSITIVE_INFINITY;
    };
};

// Opera up to version 57 did not allow to reassign the buffer of a ConvolverNode.
const createTestConvolverNodeBufferReassignabilitySupport = (nativeOfflineAudioContextConstructor) => {
    return () => {
        if (nativeOfflineAudioContextConstructor === null) {
            return false;
        }
        const offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        const nativeConvolverNode = offlineAudioContext.createConvolver();
        nativeConvolverNode.buffer = offlineAudioContext.createBuffer(1, 1, offlineAudioContext.sampleRate);
        try {
            nativeConvolverNode.buffer = offlineAudioContext.createBuffer(1, 1, offlineAudioContext.sampleRate);
        }
        catch {
            return false;
        }
        return true;
    };
};

// Chrome up to version v80, Edge up to version v80 and Opera up to version v67 did not allow to set the channelCount property of a ConvolverNode to 1. They also did not allow to set the channelCountMode to 'explicit'.
const createTestConvolverNodeChannelCountSupport = (nativeOfflineAudioContextConstructor) => {
    return () => {
        if (nativeOfflineAudioContextConstructor === null) {
            return false;
        }
        const offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        const nativeConvolverNode = offlineAudioContext.createConvolver();
        try {
            nativeConvolverNode.channelCount = 1;
        }
        catch {
            return false;
        }
        return true;
    };
};

const createTestIsSecureContextSupport = (window) => {
    return () => window !== null && window.hasOwnProperty('isSecureContext');
};

// Firefox up to version 68 did not throw an error when creating a MediaStreamAudioSourceNode with a mediaStream that had no audio track.
const createTestMediaStreamAudioSourceNodeMediaStreamWithoutAudioTrackSupport = (nativeAudioContextConstructor) => {
    return () => {
        if (nativeAudioContextConstructor === null) {
            return false;
        }
        const audioContext = new nativeAudioContextConstructor();
        try {
            audioContext.createMediaStreamSource(new MediaStream());
            return false;
        }
        catch (err) {
            return true;
        }
        finally {
            audioContext.close();
        }
    };
};

const createTestOfflineAudioContextCurrentTimeSupport = (createNativeGainNode, nativeOfflineAudioContextConstructor) => {
    return () => {
        if (nativeOfflineAudioContextConstructor === null) {
            return Promise.resolve(false);
        }
        const nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        // Bug #48: Safari does not render an OfflineAudioContext without any connected node.
        const gainNode = createNativeGainNode(nativeOfflineAudioContext, {
            channelCount: 1,
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete',
            gain: 0
        });
        // Bug #21: Safari does not support promises yet.
        return new Promise((resolve) => {
            nativeOfflineAudioContext.oncomplete = () => {
                gainNode.disconnect();
                resolve(nativeOfflineAudioContext.currentTime !== 0);
            };
            nativeOfflineAudioContext.startRendering();
        });
    };
};

/**
 * Firefox up to version 62 did not kick off the processing of the StereoPannerNode if the value of pan was zero.
 */
const createTestStereoPannerNodeDefaultValueSupport = (nativeOfflineAudioContextConstructor) => {
    return () => {
        if (nativeOfflineAudioContextConstructor === null) {
            return Promise.resolve(false);
        }
        const nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        /*
         * Bug #105: Safari does not support the StereoPannerNode. Therefore the returned value should normally be false but the faker does
         * support the tested behaviour.
         */
        if (nativeOfflineAudioContext.createStereoPanner === undefined) {
            return Promise.resolve(true);
        }
        // Bug #62: Safari does not support ConstantSourceNodes.
        if (nativeOfflineAudioContext.createConstantSource === undefined) {
            return Promise.resolve(true);
        }
        const constantSourceNode = nativeOfflineAudioContext.createConstantSource();
        const stereoPanner = nativeOfflineAudioContext.createStereoPanner();
        constantSourceNode.channelCount = 1;
        constantSourceNode.offset.value = 1;
        stereoPanner.channelCount = 1;
        constantSourceNode.start();
        constantSourceNode.connect(stereoPanner).connect(nativeOfflineAudioContext.destination);
        return nativeOfflineAudioContext.startRendering().then((buffer) => buffer.getChannelData(0)[0] !== 1);
    };
};

const createUnknownError = () => new DOMException('', 'UnknownError');

const DEFAULT_OPTIONS$j = {
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    curve: null,
    oversample: 'none'
};
const createWaveShaperNodeConstructor = (audioNodeConstructor, createInvalidStateError, createNativeWaveShaperNode, createWaveShaperNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) => {
    return class WaveShaperNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS$j, ...options };
            const nativeWaveShaperNode = createNativeWaveShaperNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const waveShaperNodeRenderer = (isOffline ? createWaveShaperNodeRenderer() : null);
            // @todo Add a mechanism to only switch a WaveShaperNode to active while it is connected.
            super(context, true, nativeWaveShaperNode, waveShaperNodeRenderer);
            this._isCurveNullified = false;
            this._nativeWaveShaperNode = nativeWaveShaperNode;
            // @todo Determine a meaningful tail-time instead of just using one second.
            setAudioNodeTailTime(this, 1);
        }
        get curve() {
            if (this._isCurveNullified) {
                return null;
            }
            return this._nativeWaveShaperNode.curve;
        }
        set curve(value) {
            // Bug #103: Safari does not allow to set the curve to null.
            if (value === null) {
                this._isCurveNullified = true;
                this._nativeWaveShaperNode.curve = new Float32Array([0, 0]);
            }
            else {
                // Bug #102: Safari does not throw an InvalidStateError when the curve has less than two samples.
                // Bug #104: Chrome, Edge and Opera will throw an InvalidAccessError when the curve has less than two samples.
                if (value.length < 2) {
                    throw createInvalidStateError();
                }
                this._isCurveNullified = false;
                this._nativeWaveShaperNode.curve = value;
            }
        }
        get oversample() {
            return this._nativeWaveShaperNode.oversample;
        }
        set oversample(value) {
            this._nativeWaveShaperNode.oversample = value;
        }
    };
};

const createWaveShaperNodeRendererFactory = (createNativeWaveShaperNode, getNativeAudioNode, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeWaveShaperNodes = new WeakMap();
        const createWaveShaperNode = async (proxy, nativeOfflineAudioContext) => {
            let nativeWaveShaperNode = getNativeAudioNode(proxy);
            // If the initially used nativeWaveShaperNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativeWaveShaperNodeIsOwnedByContext = isOwnedByContext(nativeWaveShaperNode, nativeOfflineAudioContext);
            if (!nativeWaveShaperNodeIsOwnedByContext) {
                const options = {
                    channelCount: nativeWaveShaperNode.channelCount,
                    channelCountMode: nativeWaveShaperNode.channelCountMode,
                    channelInterpretation: nativeWaveShaperNode.channelInterpretation,
                    curve: nativeWaveShaperNode.curve,
                    oversample: nativeWaveShaperNode.oversample
                };
                nativeWaveShaperNode = createNativeWaveShaperNode(nativeOfflineAudioContext, options);
            }
            renderedNativeWaveShaperNodes.set(nativeOfflineAudioContext, nativeWaveShaperNode);
            if (isNativeAudioNodeFaker(nativeWaveShaperNode)) {
                await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeWaveShaperNode.inputs[0]);
            }
            else {
                await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeWaveShaperNode);
            }
            return nativeWaveShaperNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext) {
                const renderedNativeWaveShaperNode = renderedNativeWaveShaperNodes.get(nativeOfflineAudioContext);
                if (renderedNativeWaveShaperNode !== undefined) {
                    return Promise.resolve(renderedNativeWaveShaperNode);
                }
                return createWaveShaperNode(proxy, nativeOfflineAudioContext);
            }
        };
    };
};

const createWindow = () => (typeof window === 'undefined' ? null : window);

const createWrapAudioBufferCopyChannelMethods = (convertNumberToUnsignedLong, createIndexSizeError) => {
    return (audioBuffer) => {
        audioBuffer.copyFromChannel = (destination, channelNumberAsNumber, bufferOffsetAsNumber = 0) => {
            const bufferOffset = convertNumberToUnsignedLong(bufferOffsetAsNumber);
            const channelNumber = convertNumberToUnsignedLong(channelNumberAsNumber);
            if (channelNumber >= audioBuffer.numberOfChannels) {
                throw createIndexSizeError();
            }
            const audioBufferLength = audioBuffer.length;
            const channelData = audioBuffer.getChannelData(channelNumber);
            const destinationLength = destination.length;
            for (let i = bufferOffset < 0 ? -bufferOffset : 0; i + bufferOffset < audioBufferLength && i < destinationLength; i += 1) {
                destination[i] = channelData[i + bufferOffset];
            }
        };
        audioBuffer.copyToChannel = (source, channelNumberAsNumber, bufferOffsetAsNumber = 0) => {
            const bufferOffset = convertNumberToUnsignedLong(bufferOffsetAsNumber);
            const channelNumber = convertNumberToUnsignedLong(channelNumberAsNumber);
            if (channelNumber >= audioBuffer.numberOfChannels) {
                throw createIndexSizeError();
            }
            const audioBufferLength = audioBuffer.length;
            const channelData = audioBuffer.getChannelData(channelNumber);
            const sourceLength = source.length;
            for (let i = bufferOffset < 0 ? -bufferOffset : 0; i + bufferOffset < audioBufferLength && i < sourceLength; i += 1) {
                channelData[i + bufferOffset] = source[i];
            }
        };
    };
};

const createWrapAudioBufferCopyChannelMethodsOutOfBounds = (convertNumberToUnsignedLong) => {
    return (audioBuffer) => {
        audioBuffer.copyFromChannel = ((copyFromChannel) => {
            return (destination, channelNumberAsNumber, bufferOffsetAsNumber = 0) => {
                const bufferOffset = convertNumberToUnsignedLong(bufferOffsetAsNumber);
                const channelNumber = convertNumberToUnsignedLong(channelNumberAsNumber);
                if (bufferOffset < audioBuffer.length) {
                    return copyFromChannel.call(audioBuffer, destination, channelNumber, bufferOffset);
                }
            };
        })(audioBuffer.copyFromChannel);
        audioBuffer.copyToChannel = ((copyToChannel) => {
            return (source, channelNumberAsNumber, bufferOffsetAsNumber = 0) => {
                const bufferOffset = convertNumberToUnsignedLong(bufferOffsetAsNumber);
                const channelNumber = convertNumberToUnsignedLong(channelNumberAsNumber);
                if (bufferOffset < audioBuffer.length) {
                    return copyToChannel.call(audioBuffer, source, channelNumber, bufferOffset);
                }
            };
        })(audioBuffer.copyToChannel);
    };
};

const createWrapAudioBufferSourceNodeStopMethodNullifiedBuffer = (overwriteAccessors) => {
    return (nativeAudioBufferSourceNode, nativeContext) => {
        const nullifiedBuffer = nativeContext.createBuffer(1, 1, 44100);
        if (nativeAudioBufferSourceNode.buffer === null) {
            nativeAudioBufferSourceNode.buffer = nullifiedBuffer;
        }
        overwriteAccessors(nativeAudioBufferSourceNode, 'buffer', (get) => () => {
            const value = get.call(nativeAudioBufferSourceNode);
            return value === nullifiedBuffer ? null : value;
        }, (set) => (value) => {
            return set.call(nativeAudioBufferSourceNode, value === null ? nullifiedBuffer : value);
        });
    };
};

const createWrapChannelMergerNode = (createInvalidStateError, monitorConnections) => {
    return (nativeContext, channelMergerNode) => {
        // Bug #15: Safari does not return the default properties.
        channelMergerNode.channelCount = 1;
        channelMergerNode.channelCountMode = 'explicit';
        // Bug #16: Safari does not throw an error when setting a different channelCount or channelCountMode.
        Object.defineProperty(channelMergerNode, 'channelCount', {
            get: () => 1,
            set: () => {
                throw createInvalidStateError();
            }
        });
        Object.defineProperty(channelMergerNode, 'channelCountMode', {
            get: () => 'explicit',
            set: () => {
                throw createInvalidStateError();
            }
        });
        // Bug #20: Safari requires a connection of any kind to treat the input signal correctly.
        const audioBufferSourceNode = nativeContext.createBufferSource();
        const whenConnected = () => {
            const length = channelMergerNode.numberOfInputs;
            for (let i = 0; i < length; i += 1) {
                audioBufferSourceNode.connect(channelMergerNode, 0, i);
            }
        };
        const whenDisconnected = () => audioBufferSourceNode.disconnect(channelMergerNode);
        monitorConnections(channelMergerNode, whenConnected, whenDisconnected);
    };
};

const getFirstSample = (audioBuffer, buffer, channelNumber) => {
    // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
    if (audioBuffer.copyFromChannel === undefined) {
        return audioBuffer.getChannelData(channelNumber)[0];
    }
    audioBuffer.copyFromChannel(buffer, channelNumber);
    return buffer[0];
};

const isDCCurve = (curve) => {
    if (curve === null) {
        return false;
    }
    const length = curve.length;
    if (length % 2 !== 0) {
        return curve[Math.floor(length / 2)] !== 0;
    }
    return curve[length / 2 - 1] + curve[length / 2] !== 0;
};

const overwriteAccessors = (object, property, createGetter, createSetter) => {
    let prototype = object;
    while (!prototype.hasOwnProperty(property)) {
        prototype = Object.getPrototypeOf(prototype);
    }
    const { get, set } = Object.getOwnPropertyDescriptor(prototype, property);
    Object.defineProperty(object, property, { get: createGetter(get), set: createSetter(set) });
};

const sanitizeAudioWorkletNodeOptions = (options) => {
    return {
        ...options,
        outputChannelCount: options.outputChannelCount !== undefined
            ? options.outputChannelCount
            : options.numberOfInputs === 1 && options.numberOfOutputs === 1
                ? /*
                   * Bug #61: This should be the computedNumberOfChannels, but unfortunately that is almost impossible to fake. That's why
                   * the channelCountMode is required to be 'explicit' as long as there is not a native implementation in every browser. That
                   * makes sure the computedNumberOfChannels is equivilant to the channelCount which makes it much easier to compute.
                   */
                    [options.channelCount]
                : Array.from({ length: options.numberOfOutputs }, () => 1)
    };
};

const sanitizeChannelSplitterOptions = (options) => {
    return { ...options, channelCount: options.numberOfOutputs };
};

const sanitizePeriodicWaveOptions = (options) => {
    const { imag, real } = options;
    if (imag === undefined) {
        if (real === undefined) {
            return { ...options, imag: [0, 0], real: [0, 0] };
        }
        return { ...options, imag: Array.from(real, () => 0), real };
    }
    if (real === undefined) {
        return { ...options, imag, real: Array.from(imag, () => 0) };
    }
    return { ...options, imag, real };
};

const setValueAtTimeUntilPossible = (audioParam, value, startTime) => {
    try {
        audioParam.setValueAtTime(value, startTime);
    }
    catch (err) {
        if (err.code !== 9) {
            throw err;
        }
        setValueAtTimeUntilPossible(audioParam, value, startTime + 1e-7);
    }
};

const testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport = (nativeContext) => {
    const nativeAudioBufferSourceNode = nativeContext.createBufferSource();
    nativeAudioBufferSourceNode.start();
    try {
        nativeAudioBufferSourceNode.start();
    }
    catch {
        return true;
    }
    return false;
};

const testAudioBufferSourceNodeStartMethodOffsetClampingSupport = (nativeContext) => {
    const nativeAudioBufferSourceNode = nativeContext.createBufferSource();
    const nativeAudioBuffer = nativeContext.createBuffer(1, 1, 44100);
    nativeAudioBufferSourceNode.buffer = nativeAudioBuffer;
    try {
        nativeAudioBufferSourceNode.start(0, 1);
    }
    catch {
        return false;
    }
    return true;
};

const testAudioBufferSourceNodeStopMethodNullifiedBufferSupport = (nativeContext) => {
    const nativeAudioBufferSourceNode = nativeContext.createBufferSource();
    nativeAudioBufferSourceNode.start();
    try {
        nativeAudioBufferSourceNode.stop();
    }
    catch {
        return false;
    }
    return true;
};

const testAudioScheduledSourceNodeStartMethodNegativeParametersSupport = (nativeContext) => {
    const nativeAudioBufferSourceNode = nativeContext.createOscillator();
    try {
        nativeAudioBufferSourceNode.start(-1);
    }
    catch (err) {
        return err instanceof RangeError;
    }
    return false;
};

const testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport = (nativeContext) => {
    const nativeAudioBuffer = nativeContext.createBuffer(1, 1, 44100);
    const nativeAudioBufferSourceNode = nativeContext.createBufferSource();
    nativeAudioBufferSourceNode.buffer = nativeAudioBuffer;
    nativeAudioBufferSourceNode.start();
    nativeAudioBufferSourceNode.stop();
    try {
        nativeAudioBufferSourceNode.stop();
        return true;
    }
    catch {
        return false;
    }
};

const testAudioScheduledSourceNodeStopMethodNegativeParametersSupport = (nativeContext) => {
    const nativeAudioBufferSourceNode = nativeContext.createOscillator();
    try {
        nativeAudioBufferSourceNode.stop(-1);
    }
    catch (err) {
        return err instanceof RangeError;
    }
    return false;
};

const testAudioWorkletNodeOptionsClonability = (audioWorkletNodeOptions) => {
    const { port1, port2 } = new MessageChannel();
    try {
        // This will throw an error if the audioWorkletNodeOptions are not clonable.
        port1.postMessage(audioWorkletNodeOptions);
    }
    finally {
        port1.close();
        port2.close();
    }
};

/*
 * Bug #122: Edge up to version v18 did not allow to construct a DOMException'. It also had a couple more bugs but since this is easy to
 * test it's used here as a placeholder.
 *
 * Bug #27: Edge up to version v18 did reject an invalid arrayBuffer passed to decodeAudioData() with a DOMException.
 *
 * Bug #50: Edge up to version v18 did not allow to create AudioNodes on a closed context.
 *
 * Bug #57: Edge up to version v18 did not throw an error when assigning the type of an OscillatorNode to 'custom'.
 *
 * Bug #63: Edge up to version v18 did not expose the mediaElement property of a MediaElementAudioSourceNode.
 *
 * Bug #64: Edge up to version v18 did not support the MediaStreamAudioDestinationNode.
 *
 * Bug #71: Edge up to version v18 did not allow to set the buffer of an AudioBufferSourceNode to null.
 *
 * Bug #93: Edge up to version v18 did set the sampleRate of an AudioContext to zero when it was closed.
 *
 * Bug #101: Edge up to version v18 refused to execute decodeAudioData() on a closed context.
 *
 * Bug #106: Edge up to version v18 did not expose the maxValue and minValue properties of the pan AudioParam of a StereoPannerNode.
 *
 * Bug #110: Edge up to version v18 did not expose the maxValue and minValue properties of the attack, knee, ratio, release and threshold AudioParams of a DynamicsCompressorNode.
 *
 * Bug #123: Edge up to version v18 did not support HRTF as the panningModel for a PannerNode.
 *
 * Bug #145: Edge up to version v18 did throw an IndexSizeError when an OfflineAudioContext was created with a sampleRate of zero.
 *
 * Bug #161: Edge up to version v18 did not expose the maxValue and minValue properties of the delayTime AudioParam of a DelayNode.
 */
const testDomExceptionConstructorSupport = () => {
    try {
        new DOMException(); // tslint:disable-line:no-unused-expression
    }
    catch {
        return false;
    }
    return true;
};

// Safari at version 11 did not support transferables.
const testTransferablesSupport = () => new Promise((resolve) => {
    const arrayBuffer = new ArrayBuffer(0);
    const { port1, port2 } = new MessageChannel();
    port1.onmessage = ({ data }) => resolve(data !== null);
    port2.postMessage(arrayBuffer, [arrayBuffer]);
});

const wrapAudioBufferSourceNodeStartMethodOffsetClamping = (nativeAudioBufferSourceNode) => {
    nativeAudioBufferSourceNode.start = ((start) => {
        return (when = 0, offset = 0, duration) => {
            const buffer = nativeAudioBufferSourceNode.buffer;
            // Bug #154: Safari does not clamp the offset if it is equal to or greater than the duration of the buffer.
            const clampedOffset = buffer === null ? offset : Math.min(buffer.duration, offset);
            // Bug #155: Safari does not handle the offset correctly if it would cause the buffer to be not be played at all.
            if (buffer !== null && clampedOffset > buffer.duration - 0.5 / nativeAudioBufferSourceNode.context.sampleRate) {
                start.call(nativeAudioBufferSourceNode, when, 0, 0);
            }
            else {
                start.call(nativeAudioBufferSourceNode, when, clampedOffset, duration);
            }
        };
    })(nativeAudioBufferSourceNode.start);
};

const wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls = (nativeAudioScheduledSourceNode, nativeContext) => {
    const nativeGainNode = nativeContext.createGain();
    nativeAudioScheduledSourceNode.connect(nativeGainNode);
    const disconnectGainNode = ((disconnect) => {
        return () => {
            // @todo TypeScript cannot infer the overloaded signature with 1 argument yet.
            disconnect.call(nativeAudioScheduledSourceNode, nativeGainNode);
            nativeAudioScheduledSourceNode.removeEventListener('ended', disconnectGainNode);
        };
    })(nativeAudioScheduledSourceNode.disconnect);
    nativeAudioScheduledSourceNode.addEventListener('ended', disconnectGainNode);
    interceptConnections(nativeAudioScheduledSourceNode, nativeGainNode);
    nativeAudioScheduledSourceNode.stop = ((stop) => {
        let isStopped = false;
        return (when = 0) => {
            if (isStopped) {
                try {
                    stop.call(nativeAudioScheduledSourceNode, when);
                }
                catch {
                    nativeGainNode.gain.setValueAtTime(0, when);
                }
            }
            else {
                stop.call(nativeAudioScheduledSourceNode, when);
                isStopped = true;
            }
        };
    })(nativeAudioScheduledSourceNode.stop);
};

const wrapEventListener = (target, eventListener) => {
    return (event) => {
        const descriptor = { value: target };
        Object.defineProperties(event, {
            currentTarget: descriptor,
            target: descriptor
        });
        if (typeof eventListener === 'function') {
            return eventListener.call(target, event);
        }
        return eventListener.handleEvent.call(target, event);
    };
};

const addActiveInputConnectionToAudioNode = createAddActiveInputConnectionToAudioNode(insertElementInSet);
const addPassiveInputConnectionToAudioNode = createAddPassiveInputConnectionToAudioNode(insertElementInSet);
const deleteActiveInputConnectionToAudioNode = createDeleteActiveInputConnectionToAudioNode(pickElementFromSet);
const audioNodeTailTimeStore = new WeakMap();
const getAudioNodeTailTime = createGetAudioNodeTailTime(audioNodeTailTimeStore);
const cacheTestResult = createCacheTestResult(new Map(), new WeakMap());
const window$1 = createWindow();
const createNativeAnalyserNode = createNativeAnalyserNodeFactory(cacheTestResult, createIndexSizeError);
const getAudioNodeRenderer = createGetAudioNodeRenderer(getAudioNodeConnections);
const renderInputsOfAudioNode = createRenderInputsOfAudioNode(getAudioNodeConnections, getAudioNodeRenderer, isPartOfACycle);
const createAnalyserNodeRenderer = createAnalyserNodeRendererFactory(createNativeAnalyserNode, getNativeAudioNode, renderInputsOfAudioNode);
const getNativeContext = createGetNativeContext(CONTEXT_STORE);
const nativeOfflineAudioContextConstructor = createNativeOfflineAudioContextConstructor(window$1);
const isNativeOfflineAudioContext = createIsNativeOfflineAudioContext(nativeOfflineAudioContextConstructor);
const audioParamAudioNodeStore = new WeakMap();
const eventTargetConstructor = createEventTargetConstructor(wrapEventListener);
const nativeAudioContextConstructor = createNativeAudioContextConstructor(window$1);
const isNativeAudioContext = createIsNativeAudioContext(nativeAudioContextConstructor);
const isNativeAudioNode$1 = createIsNativeAudioNode(window$1);
const isNativeAudioParam = createIsNativeAudioParam(window$1);
const nativeAudioWorkletNodeConstructor = createNativeAudioWorkletNodeConstructor(window$1);
const audioNodeConstructor = createAudioNodeConstructor(createAddAudioNodeConnections(AUDIO_NODE_CONNECTIONS_STORE), createAddConnectionToAudioNode(addActiveInputConnectionToAudioNode, addPassiveInputConnectionToAudioNode, connectNativeAudioNodeToNativeAudioNode, deleteActiveInputConnectionToAudioNode, disconnectNativeAudioNodeFromNativeAudioNode, getAudioNodeConnections, getAudioNodeTailTime, getEventListenersOfAudioNode, getNativeAudioNode, insertElementInSet, isActiveAudioNode, isPartOfACycle, isPassiveAudioNode), cacheTestResult, createIncrementCycleCounterFactory(CYCLE_COUNTERS, disconnectNativeAudioNodeFromNativeAudioNode, getAudioNodeConnections, getNativeAudioNode, getNativeAudioParam, isActiveAudioNode), createIndexSizeError, createInvalidAccessError, createNotSupportedError, createDecrementCycleCounter(connectNativeAudioNodeToNativeAudioNode, CYCLE_COUNTERS, getAudioNodeConnections, getNativeAudioNode, getNativeAudioParam, getNativeContext, isActiveAudioNode, isNativeOfflineAudioContext), createDetectCycles(audioParamAudioNodeStore, getAudioNodeConnections, getValueForKey), eventTargetConstructor, getNativeContext, isNativeAudioContext, isNativeAudioNode$1, isNativeAudioParam, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor);
const analyserNodeConstructor = createAnalyserNodeConstructor(audioNodeConstructor, createAnalyserNodeRenderer, createIndexSizeError, createNativeAnalyserNode, getNativeContext, isNativeOfflineAudioContext);
const audioBufferStore = new WeakSet();
const nativeAudioBufferConstructor = createNativeAudioBufferConstructor(window$1);
const convertNumberToUnsignedLong = createConvertNumberToUnsignedLong(new Uint32Array(1));
const wrapAudioBufferCopyChannelMethods = createWrapAudioBufferCopyChannelMethods(convertNumberToUnsignedLong, createIndexSizeError);
const wrapAudioBufferCopyChannelMethodsOutOfBounds = createWrapAudioBufferCopyChannelMethodsOutOfBounds(convertNumberToUnsignedLong);
const audioBufferConstructor = createAudioBufferConstructor(audioBufferStore, cacheTestResult, createNotSupportedError, nativeAudioBufferConstructor, nativeOfflineAudioContextConstructor, createTestAudioBufferConstructorSupport(nativeAudioBufferConstructor), wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds);
const addSilentConnection = createAddSilentConnection(createNativeGainNode);
const renderInputsOfAudioParam = createRenderInputsOfAudioParam(getAudioNodeRenderer, getAudioParamConnections, isPartOfACycle);
const connectAudioParam = createConnectAudioParam(renderInputsOfAudioParam);
const createNativeAudioBufferSourceNode = createNativeAudioBufferSourceNodeFactory(addSilentConnection, cacheTestResult, testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport, testAudioBufferSourceNodeStartMethodOffsetClampingSupport, testAudioBufferSourceNodeStopMethodNullifiedBufferSupport, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioBufferSourceNodeStartMethodOffsetClamping, createWrapAudioBufferSourceNodeStopMethodNullifiedBuffer(overwriteAccessors), wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls);
const renderAutomation = createRenderAutomation(createGetAudioParamRenderer(getAudioParamConnections), renderInputsOfAudioParam);
const createAudioBufferSourceNodeRenderer = createAudioBufferSourceNodeRendererFactory(connectAudioParam, createNativeAudioBufferSourceNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
const createAudioParam = createAudioParamFactory(createAddAudioParamConnections(AUDIO_PARAM_CONNECTIONS_STORE), audioParamAudioNodeStore, AUDIO_PARAM_STORE, createAudioParamRenderer, createCancelAndHoldAutomationEvent, createCancelScheduledValuesAutomationEvent, createExponentialRampToValueAutomationEvent, createLinearRampToValueAutomationEvent, createSetTargetAutomationEvent, createSetValueAutomationEvent, createSetValueCurveAutomationEvent, nativeAudioContextConstructor, setValueAtTimeUntilPossible);
const audioBufferSourceNodeConstructor = createAudioBufferSourceNodeConstructor(audioNodeConstructor, createAudioBufferSourceNodeRenderer, createAudioParam, createInvalidStateError, createNativeAudioBufferSourceNode, getNativeContext, isNativeOfflineAudioContext, wrapEventListener);
const audioDestinationNodeConstructor = createAudioDestinationNodeConstructor(audioNodeConstructor, createAudioDestinationNodeRenderer, createIndexSizeError, createInvalidStateError, createNativeAudioDestinationNodeFactory(createNativeGainNode, overwriteAccessors), getNativeContext, isNativeOfflineAudioContext, renderInputsOfAudioNode);
const createBiquadFilterNodeRenderer = createBiquadFilterNodeRendererFactory(connectAudioParam, createNativeBiquadFilterNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
const setAudioNodeTailTime = createSetAudioNodeTailTime(audioNodeTailTimeStore);
const biquadFilterNodeConstructor = createBiquadFilterNodeConstructor(audioNodeConstructor, createAudioParam, createBiquadFilterNodeRenderer, createInvalidAccessError, createNativeBiquadFilterNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
const monitorConnections = createMonitorConnections(insertElementInSet, isNativeAudioNode$1);
const wrapChannelMergerNode = createWrapChannelMergerNode(createInvalidStateError, monitorConnections);
const createNativeChannelMergerNode = createNativeChannelMergerNodeFactory(nativeAudioContextConstructor, wrapChannelMergerNode);
const createChannelMergerNodeRenderer = createChannelMergerNodeRendererFactory(createNativeChannelMergerNode, getNativeAudioNode, renderInputsOfAudioNode);
const channelMergerNodeConstructor = createChannelMergerNodeConstructor(audioNodeConstructor, createChannelMergerNodeRenderer, createNativeChannelMergerNode, getNativeContext, isNativeOfflineAudioContext);
const createChannelSplitterNodeRenderer = createChannelSplitterNodeRendererFactory(createNativeChannelSplitterNode, getNativeAudioNode, renderInputsOfAudioNode);
const channelSplitterNodeConstructor = createChannelSplitterNodeConstructor(audioNodeConstructor, createChannelSplitterNodeRenderer, createNativeChannelSplitterNode, getNativeContext, isNativeOfflineAudioContext, sanitizeChannelSplitterOptions);
const createNativeConstantSourceNodeFaker = createNativeConstantSourceNodeFakerFactory(addSilentConnection, createNativeAudioBufferSourceNode, createNativeGainNode, monitorConnections);
const createNativeConstantSourceNode = createNativeConstantSourceNodeFactory(addSilentConnection, cacheTestResult, createNativeConstantSourceNodeFaker, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport);
const createConstantSourceNodeRenderer = createConstantSourceNodeRendererFactory(connectAudioParam, createNativeConstantSourceNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
const constantSourceNodeConstructor = createConstantSourceNodeConstructor(audioNodeConstructor, createAudioParam, createConstantSourceNodeRenderer, createNativeConstantSourceNode, getNativeContext, isNativeOfflineAudioContext, wrapEventListener);
const createNativeConvolverNode = createNativeConvolverNodeFactory(createNotSupportedError, overwriteAccessors);
const createConvolverNodeRenderer = createConvolverNodeRendererFactory(createNativeConvolverNode, getNativeAudioNode, renderInputsOfAudioNode);
const convolverNodeConstructor = createConvolverNodeConstructor(audioNodeConstructor, createConvolverNodeRenderer, createNativeConvolverNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
const createDelayNodeRenderer = createDelayNodeRendererFactory(connectAudioParam, createNativeDelayNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
const delayNodeConstructor = createDelayNodeConstructor(audioNodeConstructor, createAudioParam, createDelayNodeRenderer, createNativeDelayNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
const createNativeDynamicsCompressorNode = createNativeDynamicsCompressorNodeFactory(createNotSupportedError);
const createDynamicsCompressorNodeRenderer = createDynamicsCompressorNodeRendererFactory(connectAudioParam, createNativeDynamicsCompressorNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
const dynamicsCompressorNodeConstructor = createDynamicsCompressorNodeConstructor(audioNodeConstructor, createAudioParam, createDynamicsCompressorNodeRenderer, createNativeDynamicsCompressorNode, createNotSupportedError, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
const createGainNodeRenderer = createGainNodeRendererFactory(connectAudioParam, createNativeGainNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
const gainNodeConstructor = createGainNodeConstructor(audioNodeConstructor, createAudioParam, createGainNodeRenderer, createNativeGainNode, getNativeContext, isNativeOfflineAudioContext);
const createNativeIIRFilterNodeFaker = createNativeIIRFilterNodeFakerFactory(createInvalidAccessError, createInvalidStateError, createNativeScriptProcessorNode, createNotSupportedError);
const renderNativeOfflineAudioContext = createRenderNativeOfflineAudioContext(cacheTestResult, createNativeGainNode, createNativeScriptProcessorNode, createTestOfflineAudioContextCurrentTimeSupport(createNativeGainNode, nativeOfflineAudioContextConstructor));
const createIIRFilterNodeRenderer = createIIRFilterNodeRendererFactory(createNativeAudioBufferSourceNode, getNativeAudioNode, nativeOfflineAudioContextConstructor, renderInputsOfAudioNode, renderNativeOfflineAudioContext);
const createNativeIIRFilterNode = createNativeIIRFilterNodeFactory(createNativeIIRFilterNodeFaker);
const iIRFilterNodeConstructor = createIIRFilterNodeConstructor(audioNodeConstructor, createNativeIIRFilterNode, createIIRFilterNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
const createAudioListener = createAudioListenerFactory(createAudioParam, createNativeChannelMergerNode, createNativeConstantSourceNode, createNativeScriptProcessorNode, createNotSupportedError, getFirstSample, isNativeOfflineAudioContext, overwriteAccessors);
const unrenderedAudioWorkletNodeStore = new WeakMap();
const minimalBaseAudioContextConstructor = createMinimalBaseAudioContextConstructor(audioDestinationNodeConstructor, createAudioListener, eventTargetConstructor, isNativeOfflineAudioContext, unrenderedAudioWorkletNodeStore, wrapEventListener);
const createNativeOscillatorNode = createNativeOscillatorNodeFactory(addSilentConnection, cacheTestResult, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls);
const createOscillatorNodeRenderer = createOscillatorNodeRendererFactory(connectAudioParam, createNativeOscillatorNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
const oscillatorNodeConstructor = createOscillatorNodeConstructor(audioNodeConstructor, createAudioParam, createNativeOscillatorNode, createOscillatorNodeRenderer, getNativeContext, isNativeOfflineAudioContext, wrapEventListener);
const createConnectedNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNodeFactory(createNativeAudioBufferSourceNode);
const createNativeWaveShaperNodeFaker = createNativeWaveShaperNodeFakerFactory(createConnectedNativeAudioBufferSourceNode, createInvalidStateError, createNativeGainNode, isDCCurve, monitorConnections);
const createNativeWaveShaperNode = createNativeWaveShaperNodeFactory(createConnectedNativeAudioBufferSourceNode, createInvalidStateError, createNativeWaveShaperNodeFaker, isDCCurve, monitorConnections, nativeAudioContextConstructor, overwriteAccessors);
const createNativePannerNodeFaker = createNativePannerNodeFakerFactory(connectNativeAudioNodeToNativeAudioNode, createInvalidStateError, createNativeChannelMergerNode, createNativeGainNode, createNativeScriptProcessorNode, createNativeWaveShaperNode, createNotSupportedError, disconnectNativeAudioNodeFromNativeAudioNode, getFirstSample, monitorConnections);
const createNativePannerNode = createNativePannerNodeFactory(createNativePannerNodeFaker);
const createPannerNodeRenderer = createPannerNodeRendererFactory(connectAudioParam, createNativeChannelMergerNode, createNativeConstantSourceNode, createNativeGainNode, createNativePannerNode, getNativeAudioNode, nativeOfflineAudioContextConstructor, renderAutomation, renderInputsOfAudioNode, renderNativeOfflineAudioContext);
const pannerNodeConstructor = createPannerNodeConstructor(audioNodeConstructor, createAudioParam, createNativePannerNode, createPannerNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
const createNativePeriodicWave = createNativePeriodicWaveFactory(createIndexSizeError);
const periodicWaveConstructor = createPeriodicWaveConstructor(createNativePeriodicWave, getNativeContext, new WeakSet(), sanitizePeriodicWaveOptions);
const nativeStereoPannerNodeFakerFactory = createNativeStereoPannerNodeFakerFactory(createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeGainNode, createNativeWaveShaperNode, createNotSupportedError, monitorConnections);
const createNativeStereoPannerNode = createNativeStereoPannerNodeFactory(nativeStereoPannerNodeFakerFactory, createNotSupportedError);
const createStereoPannerNodeRenderer = createStereoPannerNodeRendererFactory(connectAudioParam, createNativeStereoPannerNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
const stereoPannerNodeConstructor = createStereoPannerNodeConstructor(audioNodeConstructor, createAudioParam, createNativeStereoPannerNode, createStereoPannerNodeRenderer, getNativeContext, isNativeOfflineAudioContext);
const createWaveShaperNodeRenderer = createWaveShaperNodeRendererFactory(createNativeWaveShaperNode, getNativeAudioNode, renderInputsOfAudioNode);
const waveShaperNodeConstructor = createWaveShaperNodeConstructor(audioNodeConstructor, createInvalidStateError, createNativeWaveShaperNode, createWaveShaperNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
const isSecureContext = createIsSecureContext(window$1);
const exposeCurrentFrameAndCurrentTime = createExposeCurrentFrameAndCurrentTime(window$1);
const backupOfflineAudioContextStore = new WeakMap();
const getOrCreateBackupOfflineAudioContext = createGetOrCreateBackupOfflineAudioContext(backupOfflineAudioContextStore, nativeOfflineAudioContextConstructor);
// The addAudioWorkletModule() function is only available in a SecureContext.
const addAudioWorkletModule = isSecureContext
    ? createAddAudioWorkletModule(cacheTestResult, createNotSupportedError, createEvaluateSource(window$1), exposeCurrentFrameAndCurrentTime, createFetchSource(createAbortError), getNativeContext, getOrCreateBackupOfflineAudioContext, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor, new WeakMap(), new WeakMap(), createTestAudioWorkletProcessorPostMessageSupport(nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor), 
    // @todo window is guaranteed to be defined because isSecureContext checks that as well.
    window$1)
    : undefined;
const isNativeContext = createIsNativeContext(isNativeAudioContext, isNativeOfflineAudioContext);
const decodeAudioData = createDecodeAudioData(audioBufferStore, cacheTestResult, createDataCloneError, createEncodingError, new WeakSet(), getNativeContext, isNativeContext, testAudioBufferCopyChannelMethodsOutOfBoundsSupport, testPromiseSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds);
const baseAudioContextConstructor = createBaseAudioContextConstructor(addAudioWorkletModule, analyserNodeConstructor, audioBufferConstructor, audioBufferSourceNodeConstructor, biquadFilterNodeConstructor, channelMergerNodeConstructor, channelSplitterNodeConstructor, constantSourceNodeConstructor, convolverNodeConstructor, decodeAudioData, delayNodeConstructor, dynamicsCompressorNodeConstructor, gainNodeConstructor, iIRFilterNodeConstructor, minimalBaseAudioContextConstructor, oscillatorNodeConstructor, pannerNodeConstructor, periodicWaveConstructor, stereoPannerNodeConstructor, waveShaperNodeConstructor);
const mediaElementAudioSourceNodeConstructor = createMediaElementAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaElementAudioSourceNode, getNativeContext, isNativeOfflineAudioContext);
const mediaStreamAudioDestinationNodeConstructor = createMediaStreamAudioDestinationNodeConstructor(audioNodeConstructor, createNativeMediaStreamAudioDestinationNode, getNativeContext, isNativeOfflineAudioContext);
const mediaStreamAudioSourceNodeConstructor = createMediaStreamAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaStreamAudioSourceNode, getNativeContext, isNativeOfflineAudioContext);
const createNativeMediaStreamTrackAudioSourceNode = createNativeMediaStreamTrackAudioSourceNodeFactory(createInvalidStateError, isNativeOfflineAudioContext);
const mediaStreamTrackAudioSourceNodeConstructor = createMediaStreamTrackAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaStreamTrackAudioSourceNode, getNativeContext);
const audioContextConstructor = createAudioContextConstructor(baseAudioContextConstructor, createInvalidStateError, createNotSupportedError, createUnknownError, mediaElementAudioSourceNodeConstructor, mediaStreamAudioDestinationNodeConstructor, mediaStreamAudioSourceNodeConstructor, mediaStreamTrackAudioSourceNodeConstructor, nativeAudioContextConstructor);
const getUnrenderedAudioWorkletNodes = createGetUnrenderedAudioWorkletNodes(unrenderedAudioWorkletNodeStore);
const addUnrenderedAudioWorkletNode = createAddUnrenderedAudioWorkletNode(getUnrenderedAudioWorkletNodes);
const connectMultipleOutputs = createConnectMultipleOutputs(createIndexSizeError);
const deleteUnrenderedAudioWorkletNode = createDeleteUnrenderedAudioWorkletNode(getUnrenderedAudioWorkletNodes);
const disconnectMultipleOutputs = createDisconnectMultipleOutputs(createIndexSizeError);
const activeAudioWorkletNodeInputsStore = new WeakMap();
const getActiveAudioWorkletNodeInputs = createGetActiveAudioWorkletNodeInputs(activeAudioWorkletNodeInputsStore, getValueForKey);
const createNativeAudioWorkletNodeFaker = createNativeAudioWorkletNodeFakerFactory(connectMultipleOutputs, createIndexSizeError, createInvalidStateError, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, createNativeScriptProcessorNode, createNotSupportedError, disconnectMultipleOutputs, exposeCurrentFrameAndCurrentTime, getActiveAudioWorkletNodeInputs, monitorConnections);
const createNativeAudioWorkletNode = createNativeAudioWorkletNodeFactory(createInvalidStateError, createNativeAudioWorkletNodeFaker, createNativeGainNode, createNotSupportedError, monitorConnections);
const createAudioWorkletNodeRenderer = createAudioWorkletNodeRendererFactory(connectAudioParam, connectMultipleOutputs, createNativeAudioBufferSourceNode, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, deleteUnrenderedAudioWorkletNode, disconnectMultipleOutputs, exposeCurrentFrameAndCurrentTime, getNativeAudioNode, nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor, renderAutomation, renderInputsOfAudioNode, renderNativeOfflineAudioContext);
const getBackupOfflineAudioContext = createGetBackupOfflineAudioContext(backupOfflineAudioContextStore);
const setActiveAudioWorkletNodeInputs = createSetActiveAudioWorkletNodeInputs(activeAudioWorkletNodeInputsStore);
// The AudioWorkletNode constructor is only available in a SecureContext.
const audioWorkletNodeConstructor = isSecureContext
    ? createAudioWorkletNodeConstructor(addUnrenderedAudioWorkletNode, audioNodeConstructor, createAudioParam, createAudioWorkletNodeRenderer, createNativeAudioWorkletNode, getAudioNodeConnections, getBackupOfflineAudioContext, getNativeContext, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor, sanitizeAudioWorkletNodeOptions, setActiveAudioWorkletNodeInputs, testAudioWorkletNodeOptionsClonability, wrapEventListener)
    : undefined;
const createNativeOfflineAudioContext = createCreateNativeOfflineAudioContext(createNotSupportedError, nativeOfflineAudioContextConstructor);
const startRendering = createStartRendering(audioBufferStore, cacheTestResult, getAudioNodeRenderer, getUnrenderedAudioWorkletNodes, renderNativeOfflineAudioContext, testAudioBufferCopyChannelMethodsOutOfBoundsSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds);
const offlineAudioContextConstructor = createOfflineAudioContextConstructor(baseAudioContextConstructor, cacheTestResult, createInvalidStateError, createNativeOfflineAudioContext, startRendering);
const isAnyAudioContext = createIsAnyAudioContext(CONTEXT_STORE, isNativeAudioContext);
const isAnyAudioNode = createIsAnyAudioNode(AUDIO_NODE_STORE, isNativeAudioNode$1);
const isAnyAudioParam = createIsAnyAudioParam(AUDIO_PARAM_STORE, isNativeAudioParam);
const isAnyOfflineAudioContext = createIsAnyOfflineAudioContext(CONTEXT_STORE, isNativeOfflineAudioContext);
const isSupported = () => createIsSupportedPromise(cacheTestResult, createTestAudioBufferCopyChannelMethodsSubarraySupport(nativeOfflineAudioContextConstructor), createTestAudioContextCloseMethodSupport(nativeAudioContextConstructor), createTestAudioContextDecodeAudioDataMethodTypeErrorSupport(nativeOfflineAudioContextConstructor), createTestAudioContextOptionsSupport(nativeAudioContextConstructor), createTestAudioNodeConnectMethodSupport(nativeOfflineAudioContextConstructor), createTestAudioWorkletProcessorNoOutputsSupport(nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor), createTestChannelMergerNodeChannelCountSupport(nativeOfflineAudioContextConstructor), createTestConstantSourceNodeAccurateSchedulingSupport(nativeOfflineAudioContextConstructor), createTestConvolverNodeBufferReassignabilitySupport(nativeOfflineAudioContextConstructor), createTestConvolverNodeChannelCountSupport(nativeOfflineAudioContextConstructor), testDomExceptionConstructorSupport, createTestIsSecureContextSupport(window$1), createTestMediaStreamAudioSourceNodeMediaStreamWithoutAudioTrackSupport(nativeAudioContextConstructor), createTestStereoPannerNodeDefaultValueSupport(nativeOfflineAudioContextConstructor), testTransferablesSupport);

/**
 * Assert that the statement is true, otherwise invoke the error.
 * @param statement
 * @param error The message which is passed into an Error
 */
function assert(statement, error) {
    if (!statement) {
        throw new Error(error);
    }
}
/**
 * Make sure that the given value is within the range
 */
function assertRange(value, gte, lte = Infinity) {
    if (!(gte <= value && value <= lte)) {
        throw new RangeError(`Value must be within [${gte}, ${lte}], got: ${value}`);
    }
}
/**
 * Make sure that the given value is within the range
 */
function assertContextRunning(context) {
    // add a warning if the context is not started
    if (!context.isOffline && context.state !== "running") {
        warn("The AudioContext is \"suspended\". Invoke Tone.start() from a user action to start the audio.");
    }
}
/**
 * The default logger is the console
 */
let defaultLogger = console;
/**
 * Set the logging interface
 */
function setLogger(logger) {
    defaultLogger = logger;
}
/**
 * Log anything
 */
function log(...args) {
    defaultLogger.log(...args);
}
/**
 * Warn anything
 */
function warn(...args) {
    defaultLogger.warn(...args);
}

var Debug = /*#__PURE__*/Object.freeze({
    __proto__: null,
    assert: assert,
    assertRange: assertRange,
    assertContextRunning: assertContextRunning,
    setLogger: setLogger,
    log: log,
    warn: warn
});

/**
 * Test if the arg is undefined
 */
function isUndef(arg) {
    return typeof arg === "undefined";
}
/**
 * Test if the arg is not undefined
 */
function isDefined(arg) {
    return !isUndef(arg);
}
/**
 * Test if the arg is a function
 */
function isFunction(arg) {
    return typeof arg === "function";
}
/**
 * Test if the argument is a number.
 */
function isNumber(arg) {
    return (typeof arg === "number");
}
/**
 * Test if the given argument is an object literal (i.e. `{}`);
 */
function isObject(arg) {
    return (Object.prototype.toString.call(arg) === "[object Object]" && arg.constructor === Object);
}
/**
 * Test if the argument is a boolean.
 */
function isBoolean(arg) {
    return (typeof arg === "boolean");
}
/**
 * Test if the argument is an Array
 */
function isArray(arg) {
    return (Array.isArray(arg));
}
/**
 * Test if the argument is a string.
 */
function isString(arg) {
    return (typeof arg === "string");
}
/**
 * Test if the argument is in the form of a note in scientific pitch notation.
 * e.g. "C4"
 */
function isNote(arg) {
    return isString(arg) && /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i.test(arg);
}

/**
 * Create a new AudioContext
 */
function createAudioContext(options) {
    return new audioContextConstructor(options);
}
/**
 * Create a new OfflineAudioContext
 */
function createOfflineAudioContext(channels, length, sampleRate) {
    return new offlineAudioContextConstructor(channels, length, sampleRate);
}
/**
 * A reference to the window object
 * @hidden
 */
const theWindow = typeof self === "object" ? self : null;
/**
 * If the browser has a window object which has an AudioContext
 * @hidden
 */
const hasAudioContext = theWindow &&
    (theWindow.hasOwnProperty("AudioContext") || theWindow.hasOwnProperty("webkitAudioContext"));
function createAudioWorkletNode(context, name, options) {
    assert(isDefined(audioWorkletNodeConstructor), "This node only works in a secure context (https or localhost)");
    // @ts-ignore
    return new audioWorkletNodeConstructor(context, name, options);
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

/**
 * A class which provides a reliable callback using either
 * a Web Worker, or if that isn't supported, falls back to setTimeout.
 */
class Ticker {
    constructor(callback, type, updateInterval) {
        this._callback = callback;
        this._type = type;
        this._updateInterval = updateInterval;
        // create the clock source for the first time
        this._createClock();
    }
    /**
     * Generate a web worker
     */
    _createWorker() {
        const blob = new Blob([
            /* javascript */ `
			// the initial timeout time
			let timeoutTime =  ${(this._updateInterval * 1000).toFixed(1)};
			// onmessage callback
			self.onmessage = function(msg){
				timeoutTime = parseInt(msg.data);
			};
			// the tick function which posts a message
			// and schedules a new tick
			function tick(){
				setTimeout(tick, timeoutTime);
				self.postMessage('tick');
			}
			// call tick initially
			tick();
			`
        ], { type: "text/javascript" });
        const blobUrl = URL.createObjectURL(blob);
        const worker = new Worker(blobUrl);
        worker.onmessage = this._callback.bind(this);
        this._worker = worker;
    }
    /**
     * Create a timeout loop
     */
    _createTimeout() {
        this._timeout = setTimeout(() => {
            this._createTimeout();
            this._callback();
        }, this._updateInterval * 1000);
    }
    /**
     * Create the clock source.
     */
    _createClock() {
        if (this._type === "worker") {
            try {
                this._createWorker();
            }
            catch (e) {
                // workers not supported, fallback to timeout
                this._type = "timeout";
                this._createClock();
            }
        }
        else if (this._type === "timeout") {
            this._createTimeout();
        }
    }
    /**
     * Clean up the current clock source
     */
    _disposeClock() {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = 0;
        }
        if (this._worker) {
            this._worker.terminate();
            this._worker.onmessage = null;
        }
    }
    /**
     * The rate in seconds the ticker will update
     */
    get updateInterval() {
        return this._updateInterval;
    }
    set updateInterval(interval) {
        this._updateInterval = Math.max(interval, 128 / 44100);
        if (this._type === "worker") {
            this._worker.postMessage(Math.max(interval * 1000, 1));
        }
    }
    /**
     * The type of the ticker, either a worker or a timeout
     */
    get type() {
        return this._type;
    }
    set type(type) {
        this._disposeClock();
        this._type = type;
        this._createClock();
    }
    /**
     * Clean up
     */
    dispose() {
        this._disposeClock();
    }
}

/**
 * Test if the given value is an instanceof AudioParam
 */
function isAudioParam(arg) {
    return isAnyAudioParam(arg);
}
/**
 * Test if the given value is an instanceof AudioNode
 */
function isAudioNode$1(arg) {
    return isAnyAudioNode(arg);
}
/**
 * Test if the arg is instanceof an OfflineAudioContext
 */
function isOfflineAudioContext(arg) {
    return isAnyOfflineAudioContext(arg);
}
/**
 * Test if the arg is an instanceof AudioContext
 */
function isAudioContext(arg) {
    return isAnyAudioContext(arg);
}
/**
 * Test if the arg is instanceof an AudioBuffer
 */
function isAudioBuffer(arg) {
    return arg instanceof AudioBuffer;
}

/**
 * Some objects should not be merged
 */
function noCopy(key, arg) {
    return key === "value" || isAudioParam(arg) || isAudioNode$1(arg) || isAudioBuffer(arg);
}
function deepMerge(target, ...sources) {
    if (!sources.length) {
        return target;
    }
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (noCopy(key, source[key])) {
                target[key] = source[key];
            }
            else if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                deepMerge(target[key], source[key]);
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    // @ts-ignore
    return deepMerge(target, ...sources);
}
/**
 * Returns true if the two arrays have the same value for each of the elements
 */
function deepEquals(arrayA, arrayB) {
    return arrayA.length === arrayB.length && arrayA.every((element, index) => arrayB[index] === element);
}
/**
 * Convert an args array into an object.
 */
function optionsFromArguments(defaults, argsArray, keys = [], objKey) {
    const opts = {};
    const args = Array.from(argsArray);
    // if the first argument is an object and has an object key
    if (isObject(args[0]) && objKey && !Reflect.has(args[0], objKey)) {
        // if it's not part of the defaults
        const partOfDefaults = Object.keys(args[0]).some(key => Reflect.has(defaults, key));
        if (!partOfDefaults) {
            // merge that key
            deepMerge(opts, { [objKey]: args[0] });
            // remove the obj key from the keys
            keys.splice(keys.indexOf(objKey), 1);
            // shift the first argument off
            args.shift();
        }
    }
    if (args.length === 1 && isObject(args[0])) {
        deepMerge(opts, args[0]);
    }
    else {
        for (let i = 0; i < keys.length; i++) {
            if (isDefined(args[i])) {
                opts[keys[i]] = args[i];
            }
        }
    }
    return deepMerge(defaults, opts);
}
/**
 * Return this instances default values by calling Constructor.getDefaults()
 */
function getDefaultsFromInstance(instance) {
    return instance.constructor.getDefaults();
}
/**
 * Returns the fallback if the given object is undefined.
 * Take an array of arguments and return a formatted options object.
 */
function defaultArg(given, fallback) {
    if (isUndef(given)) {
        return fallback;
    }
    else {
        return given;
    }
}
/**
 * Remove all of the properties belonging to omit from obj.
 */
function omitFromObject(obj, omit) {
    omit.forEach(prop => {
        if (Reflect.has(obj, prop)) {
            delete obj[prop];
        }
    });
    return obj;
}

/**
 * Tone.js
 * @author Yotam Mann
 * @license http://opensource.org/licenses/MIT MIT License
 * @copyright 2014-2019 Yotam Mann
 */
/**
 * @class  Tone is the base class of all other classes.
 * @category Core
 * @constructor
 */
class Tone {
    constructor() {
        //-------------------------------------
        // 	DEBUGGING
        //-------------------------------------
        /**
         * Set this debug flag to log all events that happen in this class.
         */
        this.debug = false;
        //-------------------------------------
        // 	DISPOSING
        //-------------------------------------
        /**
         * Indicates if the instance was disposed
         */
        this._wasDisposed = false;
    }
    /**
     * Returns all of the default options belonging to the class.
     */
    static getDefaults() {
        return {};
    }
    /**
     * Prints the outputs to the console log for debugging purposes.
     * Prints the contents only if either the object has a property
     * called `debug` set to true, or a variable called TONE_DEBUG_CLASS
     * is set to the name of the class.
     * @example
     * const osc = new Tone.Oscillator();
     * // prints all logs originating from this oscillator
     * osc.debug = true;
     * // calls to start/stop will print in the console
     * osc.start();
     */
    log(...args) {
        // if the object is either set to debug = true
        // or if there is a string on the Tone.global.with the class name
        if (this.debug || (theWindow && this.toString() === theWindow.TONE_DEBUG_CLASS)) {
            log(this, ...args);
        }
    }
    /**
     * disconnect and dispose.
     */
    dispose() {
        this._wasDisposed = true;
        return this;
    }
    /**
     * Indicates if the instance was disposed. 'Disposing' an
     * instance means that all of the Web Audio nodes that were
     * created for the instance are disconnected and freed for garbage collection.
     */
    get disposed() {
        return this._wasDisposed;
    }
    /**
     * Convert the class to a string
     * @example
     * const osc = new Tone.Oscillator();
     * console.log(osc.toString());
     */
    toString() {
        return this.name;
    }
}
/**
 * The version number semver
 */
Tone.version = version;

/**
 * The threshold for correctness for operators. Less than one sample even
 * at very high sampling rates (e.g. `1e-6 < 1 / 192000`).
 */
const EPSILON = 1e-6;
/**
 * Test if A is greater than B
 */
function GT(a, b) {
    return a > b + EPSILON;
}
/**
 * Test if A is greater than or equal to B
 */
function GTE(a, b) {
    return GT(a, b) || EQ(a, b);
}
/**
 * Test if A is less than B
 */
function LT(a, b) {
    return a + EPSILON < b;
}
/**
 * Test if A is less than B
 */
function EQ(a, b) {
    return Math.abs(a - b) < EPSILON;
}
/**
 * Clamp the value within the given range
 */
function clamp(value, min, max) {
    return Math.max(Math.min(value, max), min);
}

/**
 * A Timeline class for scheduling and maintaining state
 * along a timeline. All events must have a "time" property.
 * Internally, events are stored in time order for fast
 * retrieval.
 */
class Timeline extends Tone {
    constructor() {
        super();
        this.name = "Timeline";
        /**
         * The array of scheduled timeline events
         */
        this._timeline = [];
        const options = optionsFromArguments(Timeline.getDefaults(), arguments, ["memory"]);
        this.memory = options.memory;
        this.increasing = options.increasing;
    }
    static getDefaults() {
        return {
            memory: Infinity,
            increasing: false,
        };
    }
    /**
     * The number of items in the timeline.
     */
    get length() {
        return this._timeline.length;
    }
    /**
     * Insert an event object onto the timeline. Events must have a "time" attribute.
     * @param event  The event object to insert into the timeline.
     */
    add(event) {
        // the event needs to have a time attribute
        assert(Reflect.has(event, "time"), "Timeline: events must have a time attribute");
        event.time = event.time.valueOf();
        if (this.increasing && this.length) {
            const lastValue = this._timeline[this.length - 1];
            assert(GTE(event.time, lastValue.time), "The time must be greater than or equal to the last scheduled time");
            this._timeline.push(event);
        }
        else {
            const index = this._search(event.time);
            this._timeline.splice(index + 1, 0, event);
        }
        // if the length is more than the memory, remove the previous ones
        if (this.length > this.memory) {
            const diff = this.length - this.memory;
            this._timeline.splice(0, diff);
        }
        return this;
    }
    /**
     * Remove an event from the timeline.
     * @param  {Object}  event  The event object to remove from the list.
     * @returns {Timeline} this
     */
    remove(event) {
        const index = this._timeline.indexOf(event);
        if (index !== -1) {
            this._timeline.splice(index, 1);
        }
        return this;
    }
    /**
     * Get the nearest event whose time is less than or equal to the given time.
     * @param  time  The time to query.
     */
    get(time, param = "time") {
        const index = this._search(time, param);
        if (index !== -1) {
            return this._timeline[index];
        }
        else {
            return null;
        }
    }
    /**
     * Return the first event in the timeline without removing it
     * @returns {Object} The first event object
     */
    peek() {
        return this._timeline[0];
    }
    /**
     * Return the first event in the timeline and remove it
     */
    shift() {
        return this._timeline.shift();
    }
    /**
     * Get the event which is scheduled after the given time.
     * @param  time  The time to query.
     */
    getAfter(time, param = "time") {
        const index = this._search(time, param);
        if (index + 1 < this._timeline.length) {
            return this._timeline[index + 1];
        }
        else {
            return null;
        }
    }
    /**
     * Get the event before the event at the given time.
     * @param  time  The time to query.
     */
    getBefore(time) {
        const len = this._timeline.length;
        // if it's after the last item, return the last item
        if (len > 0 && this._timeline[len - 1].time < time) {
            return this._timeline[len - 1];
        }
        const index = this._search(time);
        if (index - 1 >= 0) {
            return this._timeline[index - 1];
        }
        else {
            return null;
        }
    }
    /**
     * Cancel events at and after the given time
     * @param  after  The time to query.
     */
    cancel(after) {
        if (this._timeline.length > 1) {
            let index = this._search(after);
            if (index >= 0) {
                if (EQ(this._timeline[index].time, after)) {
                    // get the first item with that time
                    for (let i = index; i >= 0; i--) {
                        if (EQ(this._timeline[i].time, after)) {
                            index = i;
                        }
                        else {
                            break;
                        }
                    }
                    this._timeline = this._timeline.slice(0, index);
                }
                else {
                    this._timeline = this._timeline.slice(0, index + 1);
                }
            }
            else {
                this._timeline = [];
            }
        }
        else if (this._timeline.length === 1) {
            // the first item's time
            if (GTE(this._timeline[0].time, after)) {
                this._timeline = [];
            }
        }
        return this;
    }
    /**
     * Cancel events before or equal to the given time.
     * @param  time  The time to cancel before.
     */
    cancelBefore(time) {
        const index = this._search(time);
        if (index >= 0) {
            this._timeline = this._timeline.slice(index + 1);
        }
        return this;
    }
    /**
     * Returns the previous event if there is one. null otherwise
     * @param  event The event to find the previous one of
     * @return The event right before the given event
     */
    previousEvent(event) {
        const index = this._timeline.indexOf(event);
        if (index > 0) {
            return this._timeline[index - 1];
        }
        else {
            return null;
        }
    }
    /**
     * Does a binary search on the timeline array and returns the
     * nearest event index whose time is after or equal to the given time.
     * If a time is searched before the first index in the timeline, -1 is returned.
     * If the time is after the end, the index of the last item is returned.
     */
    _search(time, param = "time") {
        if (this._timeline.length === 0) {
            return -1;
        }
        let beginning = 0;
        const len = this._timeline.length;
        let end = len;
        if (len > 0 && this._timeline[len - 1][param] <= time) {
            return len - 1;
        }
        while (beginning < end) {
            // calculate the midpoint for roughly equal partition
            let midPoint = Math.floor(beginning + (end - beginning) / 2);
            const event = this._timeline[midPoint];
            const nextEvent = this._timeline[midPoint + 1];
            if (EQ(event[param], time)) {
                // choose the last one that has the same time
                for (let i = midPoint; i < this._timeline.length; i++) {
                    const testEvent = this._timeline[i];
                    if (EQ(testEvent[param], time)) {
                        midPoint = i;
                    }
                    else {
                        break;
                    }
                }
                return midPoint;
            }
            else if (LT(event[param], time) && GT(nextEvent[param], time)) {
                return midPoint;
            }
            else if (GT(event[param], time)) {
                // search lower
                end = midPoint;
            }
            else {
                // search upper
                beginning = midPoint + 1;
            }
        }
        return -1;
    }
    /**
     * Internal iterator. Applies extra safety checks for
     * removing items from the array.
     */
    _iterate(callback, lowerBound = 0, upperBound = this._timeline.length - 1) {
        this._timeline.slice(lowerBound, upperBound + 1).forEach(callback);
    }
    /**
     * Iterate over everything in the array
     * @param  callback The callback to invoke with every item
     */
    forEach(callback) {
        this._iterate(callback);
        return this;
    }
    /**
     * Iterate over everything in the array at or before the given time.
     * @param  time The time to check if items are before
     * @param  callback The callback to invoke with every item
     */
    forEachBefore(time, callback) {
        // iterate over the items in reverse so that removing an item doesn't break things
        const upperBound = this._search(time);
        if (upperBound !== -1) {
            this._iterate(callback, 0, upperBound);
        }
        return this;
    }
    /**
     * Iterate over everything in the array after the given time.
     * @param  time The time to check if items are before
     * @param  callback The callback to invoke with every item
     */
    forEachAfter(time, callback) {
        // iterate over the items in reverse so that removing an item doesn't break things
        const lowerBound = this._search(time);
        this._iterate(callback, lowerBound + 1);
        return this;
    }
    /**
     * Iterate over everything in the array between the startTime and endTime.
     * The timerange is inclusive of the startTime, but exclusive of the endTime.
     * range = [startTime, endTime).
     * @param  startTime The time to check if items are before
     * @param  endTime The end of the test interval.
     * @param  callback The callback to invoke with every item
     */
    forEachBetween(startTime, endTime, callback) {
        let lowerBound = this._search(startTime);
        let upperBound = this._search(endTime);
        if (lowerBound !== -1 && upperBound !== -1) {
            if (this._timeline[lowerBound].time !== startTime) {
                lowerBound += 1;
            }
            // exclusive of the end time
            if (this._timeline[upperBound].time === endTime) {
                upperBound -= 1;
            }
            this._iterate(callback, lowerBound, upperBound);
        }
        else if (lowerBound === -1) {
            this._iterate(callback, 0, upperBound);
        }
        return this;
    }
    /**
     * Iterate over everything in the array at or after the given time. Similar to
     * forEachAfter, but includes the item(s) at the given time.
     * @param  time The time to check if items are before
     * @param  callback The callback to invoke with every item
     */
    forEachFrom(time, callback) {
        // iterate over the items in reverse so that removing an item doesn't break things
        let lowerBound = this._search(time);
        // work backwards until the event time is less than time
        while (lowerBound >= 0 && this._timeline[lowerBound].time >= time) {
            lowerBound--;
        }
        this._iterate(callback, lowerBound + 1);
        return this;
    }
    /**
     * Iterate over everything in the array at the given time
     * @param  time The time to check if items are before
     * @param  callback The callback to invoke with every item
     */
    forEachAtTime(time, callback) {
        // iterate over the items in reverse so that removing an item doesn't break things
        const upperBound = this._search(time);
        if (upperBound !== -1 && EQ(this._timeline[upperBound].time, time)) {
            let lowerBound = upperBound;
            for (let i = upperBound; i >= 0; i--) {
                if (EQ(this._timeline[i].time, time)) {
                    lowerBound = i;
                }
                else {
                    break;
                }
            }
            this._iterate(event => {
                callback(event);
            }, lowerBound, upperBound);
        }
        return this;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._timeline = [];
        return this;
    }
}

//-------------------------------------
// INITIALIZING NEW CONTEXT
//-------------------------------------
/**
 * Array of callbacks to invoke when a new context is created
 */
const notifyNewContext = [];
/**
 * Used internally to setup a new Context
 */
function onContextInit(cb) {
    notifyNewContext.push(cb);
}
/**
 * Invoke any classes which need to also be initialized when a new context is created.
 */
function initializeContext(ctx) {
    // add any additional modules
    notifyNewContext.forEach(cb => cb(ctx));
}
/**
 * Array of callbacks to invoke when a new context is created
 */
const notifyCloseContext = [];
/**
 * Used internally to tear down a Context
 */
function onContextClose(cb) {
    notifyCloseContext.push(cb);
}
function closeContext(ctx) {
    // add any additional modules
    notifyCloseContext.forEach(cb => cb(ctx));
}

/**
 * Emitter gives classes which extend it
 * the ability to listen for and emit events.
 * Inspiration and reference from Jerome Etienne's [MicroEvent](https://github.com/jeromeetienne/microevent.js).
 * MIT (c) 2011 Jerome Etienne.
 * @category Core
 */
class Emitter extends Tone {
    constructor() {
        super(...arguments);
        this.name = "Emitter";
    }
    /**
     * Bind a callback to a specific event.
     * @param  event     The name of the event to listen for.
     * @param  callback  The callback to invoke when the event is emitted
     */
    on(event, callback) {
        // split the event
        const events = event.split(/\W+/);
        events.forEach(eventName => {
            if (isUndef(this._events)) {
                this._events = {};
            }
            if (!this._events.hasOwnProperty(eventName)) {
                this._events[eventName] = [];
            }
            this._events[eventName].push(callback);
        });
        return this;
    }
    /**
     * Bind a callback which is only invoked once
     * @param  event     The name of the event to listen for.
     * @param  callback  The callback to invoke when the event is emitted
     */
    once(event, callback) {
        const boundCallback = (...args) => {
            // invoke the callback
            callback(...args);
            // remove the event
            this.off(event, boundCallback);
        };
        this.on(event, boundCallback);
        return this;
    }
    /**
     * Remove the event listener.
     * @param  event     The event to stop listening to.
     * @param  callback  The callback which was bound to the event with Emitter.on.
     *                   If no callback is given, all callbacks events are removed.
     */
    off(event, callback) {
        const events = event.split(/\W+/);
        events.forEach(eventName => {
            if (isUndef(this._events)) {
                this._events = {};
            }
            if (this._events.hasOwnProperty(event)) {
                if (isUndef(callback)) {
                    this._events[event] = [];
                }
                else {
                    const eventList = this._events[event];
                    for (let i = eventList.length - 1; i >= 0; i--) {
                        if (eventList[i] === callback) {
                            eventList.splice(i, 1);
                        }
                    }
                }
            }
        });
        return this;
    }
    /**
     * Invoke all of the callbacks bound to the event
     * with any arguments passed in.
     * @param  event  The name of the event.
     * @param args The arguments to pass to the functions listening.
     */
    emit(event, ...args) {
        if (this._events) {
            if (this._events.hasOwnProperty(event)) {
                const eventList = this._events[event].slice(0);
                for (let i = 0, len = eventList.length; i < len; i++) {
                    eventList[i].apply(this, args);
                }
            }
        }
        return this;
    }
    /**
     * Add Emitter functions (on/off/emit) to the object
     */
    static mixin(constr) {
        // instance._events = {};
        ["on", "once", "off", "emit"].forEach(name => {
            const property = Object.getOwnPropertyDescriptor(Emitter.prototype, name);
            Object.defineProperty(constr.prototype, name, property);
        });
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this._events = undefined;
        return this;
    }
}

class BaseContext extends Emitter {
    constructor() {
        super(...arguments);
        this.isOffline = false;
    }
    /*
     * This is a placeholder so that JSON.stringify does not throw an error
     * This matches what JSON.stringify(audioContext) returns on a native
     * audioContext instance.
     */
    toJSON() {
        return {};
    }
}

/**
 * Wrapper around the native AudioContext.
 * @category Core
 */
class Context extends BaseContext {
    constructor() {
        super();
        this.name = "Context";
        /**
         * An object containing all of the constants AudioBufferSourceNodes
         */
        this._constants = new Map();
        /**
         * All of the setTimeout events.
         */
        this._timeouts = new Timeline();
        /**
         * The timeout id counter
         */
        this._timeoutIds = 0;
        /**
         * Private indicator if the context has been initialized
         */
        this._initialized = false;
        /**
         * Indicates if the context is an OfflineAudioContext or an AudioContext
         */
        this.isOffline = false;
        //--------------------------------------------
        // AUDIO WORKLET
        //--------------------------------------------
        /**
         * Maps a module name to promise of the addModule method
         */
        this._workletModules = new Map();
        const options = optionsFromArguments(Context.getDefaults(), arguments, [
            "context",
        ]);
        if (options.context) {
            this._context = options.context;
        }
        else {
            this._context = createAudioContext({
                latencyHint: options.latencyHint,
            });
        }
        this._ticker = new Ticker(this.emit.bind(this, "tick"), options.clockSource, options.updateInterval);
        this.on("tick", this._timeoutLoop.bind(this));
        // fwd events from the context
        this._context.onstatechange = () => {
            this.emit("statechange", this.state);
        };
        this._setLatencyHint(options.latencyHint);
        this.lookAhead = options.lookAhead;
    }
    static getDefaults() {
        return {
            clockSource: "worker",
            latencyHint: "interactive",
            lookAhead: 0.1,
            updateInterval: 0.05,
        };
    }
    /**
     * Finish setting up the context. **You usually do not need to do this manually.**
     */
    initialize() {
        if (!this._initialized) {
            // add any additional modules
            initializeContext(this);
            this._initialized = true;
        }
        return this;
    }
    //---------------------------
    // BASE AUDIO CONTEXT METHODS
    //---------------------------
    createAnalyser() {
        return this._context.createAnalyser();
    }
    createOscillator() {
        return this._context.createOscillator();
    }
    createBufferSource() {
        return this._context.createBufferSource();
    }
    createBiquadFilter() {
        return this._context.createBiquadFilter();
    }
    createBuffer(numberOfChannels, length, sampleRate) {
        return this._context.createBuffer(numberOfChannels, length, sampleRate);
    }
    createChannelMerger(numberOfInputs) {
        return this._context.createChannelMerger(numberOfInputs);
    }
    createChannelSplitter(numberOfOutputs) {
        return this._context.createChannelSplitter(numberOfOutputs);
    }
    createConstantSource() {
        return this._context.createConstantSource();
    }
    createConvolver() {
        return this._context.createConvolver();
    }
    createDelay(maxDelayTime) {
        return this._context.createDelay(maxDelayTime);
    }
    createDynamicsCompressor() {
        return this._context.createDynamicsCompressor();
    }
    createGain() {
        return this._context.createGain();
    }
    createIIRFilter(feedForward, feedback) {
        // @ts-ignore
        return this._context.createIIRFilter(feedForward, feedback);
    }
    createPanner() {
        return this._context.createPanner();
    }
    createPeriodicWave(real, imag, constraints) {
        return this._context.createPeriodicWave(real, imag, constraints);
    }
    createStereoPanner() {
        return this._context.createStereoPanner();
    }
    createWaveShaper() {
        return this._context.createWaveShaper();
    }
    createMediaStreamSource(stream) {
        assert(isAudioContext(this._context), "Not available if OfflineAudioContext");
        const context = this._context;
        return context.createMediaStreamSource(stream);
    }
    createMediaElementSource(element) {
        assert(isAudioContext(this._context), "Not available if OfflineAudioContext");
        const context = this._context;
        return context.createMediaElementSource(element);
    }
    createMediaStreamDestination() {
        assert(isAudioContext(this._context), "Not available if OfflineAudioContext");
        const context = this._context;
        return context.createMediaStreamDestination();
    }
    decodeAudioData(audioData) {
        return this._context.decodeAudioData(audioData);
    }
    /**
     * The current time in seconds of the AudioContext.
     */
    get currentTime() {
        return this._context.currentTime;
    }
    /**
     * The current time in seconds of the AudioContext.
     */
    get state() {
        return this._context.state;
    }
    /**
     * The current time in seconds of the AudioContext.
     */
    get sampleRate() {
        return this._context.sampleRate;
    }
    /**
     * The listener
     */
    get listener() {
        this.initialize();
        return this._listener;
    }
    set listener(l) {
        assert(!this._initialized, "The listener cannot be set after initialization.");
        this._listener = l;
    }
    /**
     * There is only one Transport per Context. It is created on initialization.
     */
    get transport() {
        this.initialize();
        return this._transport;
    }
    set transport(t) {
        assert(!this._initialized, "The transport cannot be set after initialization.");
        this._transport = t;
    }
    /**
     * This is the Draw object for the context which is useful for synchronizing the draw frame with the Tone.js clock.
     */
    get draw() {
        this.initialize();
        return this._draw;
    }
    set draw(d) {
        assert(!this._initialized, "Draw cannot be set after initialization.");
        this._draw = d;
    }
    /**
     * A reference to the Context's destination node.
     */
    get destination() {
        this.initialize();
        return this._destination;
    }
    set destination(d) {
        assert(!this._initialized, "The destination cannot be set after initialization.");
        this._destination = d;
    }
    /**
     * Create an audio worklet node from a name and options. The module
     * must first be loaded using [[addAudioWorkletModule]].
     */
    createAudioWorkletNode(name, options) {
        return createAudioWorkletNode(this.rawContext, name, options);
    }
    /**
     * Add an AudioWorkletProcessor module
     * @param url The url of the module
     * @param name The name of the module
     */
    addAudioWorkletModule(url, name) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(isDefined(this.rawContext.audioWorklet), "AudioWorkletNode is only available in a secure context (https or localhost)");
            if (!this._workletModules.has(name)) {
                this._workletModules.set(name, this.rawContext.audioWorklet.addModule(url));
            }
            yield this._workletModules.get(name);
        });
    }
    /**
     * Returns a promise which resolves when all of the worklets have been loaded on this context
     */
    workletsAreReady() {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            this._workletModules.forEach((promise) => promises.push(promise));
            yield Promise.all(promises);
        });
    }
    //---------------------------
    // TICKER
    //---------------------------
    /**
     * How often the interval callback is invoked.
     * This number corresponds to how responsive the scheduling
     * can be. context.updateInterval + context.lookAhead gives you the
     * total latency between scheduling an event and hearing it.
     */
    get updateInterval() {
        return this._ticker.updateInterval;
    }
    set updateInterval(interval) {
        this._ticker.updateInterval = interval;
    }
    /**
     * What the source of the clock is, either "worker" (default),
     * "timeout", or "offline" (none).
     */
    get clockSource() {
        return this._ticker.type;
    }
    set clockSource(type) {
        this._ticker.type = type;
    }
    /**
     * The type of playback, which affects tradeoffs between audio
     * output latency and responsiveness.
     * In addition to setting the value in seconds, the latencyHint also
     * accepts the strings "interactive" (prioritizes low latency),
     * "playback" (prioritizes sustained playback), "balanced" (balances
     * latency and performance).
     * @example
     * // prioritize sustained playback
     * const context = new Tone.Context({ latencyHint: "playback" });
     * // set this context as the global Context
     * Tone.setContext(context);
     * // the global context is gettable with Tone.getContext()
     * console.log(Tone.getContext().latencyHint);
     */
    get latencyHint() {
        return this._latencyHint;
    }
    /**
     * Update the lookAhead and updateInterval based on the latencyHint
     */
    _setLatencyHint(hint) {
        let lookAheadValue = 0;
        this._latencyHint = hint;
        if (isString(hint)) {
            switch (hint) {
                case "interactive":
                    lookAheadValue = 0.1;
                    break;
                case "playback":
                    lookAheadValue = 0.5;
                    break;
                case "balanced":
                    lookAheadValue = 0.25;
                    break;
            }
        }
        this.lookAhead = lookAheadValue;
        this.updateInterval = lookAheadValue / 2;
    }
    /**
     * The unwrapped AudioContext or OfflineAudioContext
     */
    get rawContext() {
        return this._context;
    }
    /**
     * The current audio context time plus a short [[lookAhead]].
     */
    now() {
        return this._context.currentTime + this.lookAhead;
    }
    /**
     * The current audio context time without the [[lookAhead]].
     * In most cases it is better to use [[now]] instead of [[immediate]] since
     * with [[now]] the [[lookAhead]] is applied equally to _all_ components including internal components,
     * to making sure that everything is scheduled in sync. Mixing [[now]] and [[immediate]]
     * can cause some timing issues. If no lookAhead is desired, you can set the [[lookAhead]] to `0`.
     */
    immediate() {
        return this._context.currentTime;
    }
    /**
     * Starts the audio context from a suspended state. This is required
     * to initially start the AudioContext. See [[Tone.start]]
     */
    resume() {
        if (isAudioContext(this._context)) {
            return this._context.resume();
        }
        else {
            return Promise.resolve();
        }
    }
    /**
     * Close the context. Once closed, the context can no longer be used and
     * any AudioNodes created from the context will be silent.
     */
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (isAudioContext(this._context)) {
                yield this._context.close();
            }
            if (this._initialized) {
                closeContext(this);
            }
        });
    }
    /**
     * **Internal** Generate a looped buffer at some constant value.
     */
    getConstant(val) {
        if (this._constants.has(val)) {
            return this._constants.get(val);
        }
        else {
            const buffer = this._context.createBuffer(1, 128, this._context.sampleRate);
            const arr = buffer.getChannelData(0);
            for (let i = 0; i < arr.length; i++) {
                arr[i] = val;
            }
            const constant = this._context.createBufferSource();
            constant.channelCount = 1;
            constant.channelCountMode = "explicit";
            constant.buffer = buffer;
            constant.loop = true;
            constant.start(0);
            this._constants.set(val, constant);
            return constant;
        }
    }
    /**
     * Clean up. Also closes the audio context.
     */
    dispose() {
        super.dispose();
        this._ticker.dispose();
        this._timeouts.dispose();
        Object.keys(this._constants).map((val) => this._constants[val].disconnect());
        return this;
    }
    //---------------------------
    // TIMEOUTS
    //---------------------------
    /**
     * The private loop which keeps track of the context scheduled timeouts
     * Is invoked from the clock source
     */
    _timeoutLoop() {
        const now = this.now();
        let firstEvent = this._timeouts.peek();
        while (this._timeouts.length && firstEvent && firstEvent.time <= now) {
            // invoke the callback
            firstEvent.callback();
            // shift the first event off
            this._timeouts.shift();
            // get the next one
            firstEvent = this._timeouts.peek();
        }
    }
    /**
     * A setTimeout which is guaranteed by the clock source.
     * Also runs in the offline context.
     * @param  fn       The callback to invoke
     * @param  timeout  The timeout in seconds
     * @returns ID to use when invoking Context.clearTimeout
     */
    setTimeout(fn, timeout) {
        this._timeoutIds++;
        const now = this.now();
        this._timeouts.add({
            callback: fn,
            id: this._timeoutIds,
            time: now + timeout,
        });
        return this._timeoutIds;
    }
    /**
     * Clears a previously scheduled timeout with Tone.context.setTimeout
     * @param  id  The ID returned from setTimeout
     */
    clearTimeout(id) {
        this._timeouts.forEach((event) => {
            if (event.id === id) {
                this._timeouts.remove(event);
            }
        });
        return this;
    }
    /**
     * Clear the function scheduled by [[setInterval]]
     */
    clearInterval(id) {
        return this.clearTimeout(id);
    }
    /**
     * Adds a repeating event to the context's callback clock
     */
    setInterval(fn, interval) {
        const id = ++this._timeoutIds;
        const intervalFn = () => {
            const now = this.now();
            this._timeouts.add({
                callback: () => {
                    // invoke the callback
                    fn();
                    // invoke the event to repeat it
                    intervalFn();
                },
                id,
                time: now + interval,
            });
        };
        // kick it off
        intervalFn();
        return id;
    }
}

class DummyContext extends BaseContext {
    constructor() {
        super(...arguments);
        this.lookAhead = 0;
        this.latencyHint = 0;
        this.isOffline = false;
    }
    //---------------------------
    // BASE AUDIO CONTEXT METHODS
    //---------------------------
    createAnalyser() {
        return {};
    }
    createOscillator() {
        return {};
    }
    createBufferSource() {
        return {};
    }
    createBiquadFilter() {
        return {};
    }
    createBuffer(_numberOfChannels, _length, _sampleRate) {
        return {};
    }
    createChannelMerger(_numberOfInputs) {
        return {};
    }
    createChannelSplitter(_numberOfOutputs) {
        return {};
    }
    createConstantSource() {
        return {};
    }
    createConvolver() {
        return {};
    }
    createDelay(_maxDelayTime) {
        return {};
    }
    createDynamicsCompressor() {
        return {};
    }
    createGain() {
        return {};
    }
    createIIRFilter(_feedForward, _feedback) {
        return {};
    }
    createPanner() {
        return {};
    }
    createPeriodicWave(_real, _imag, _constraints) {
        return {};
    }
    createStereoPanner() {
        return {};
    }
    createWaveShaper() {
        return {};
    }
    createMediaStreamSource(_stream) {
        return {};
    }
    createMediaElementSource(_element) {
        return {};
    }
    createMediaStreamDestination() {
        return {};
    }
    decodeAudioData(_audioData) {
        return Promise.resolve({});
    }
    //---------------------------
    // TONE AUDIO CONTEXT METHODS
    //---------------------------
    createAudioWorkletNode(_name, _options) {
        return {};
    }
    get rawContext() {
        return {};
    }
    addAudioWorkletModule(_url, _name) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    resume() {
        return Promise.resolve();
    }
    setTimeout(_fn, _timeout) {
        return 0;
    }
    clearTimeout(_id) {
        return this;
    }
    setInterval(_fn, _interval) {
        return 0;
    }
    clearInterval(_id) {
        return this;
    }
    getConstant(_val) {
        return {};
    }
    get currentTime() {
        return 0;
    }
    get state() {
        return {};
    }
    get sampleRate() {
        return 0;
    }
    get listener() {
        return {};
    }
    get transport() {
        return {};
    }
    get draw() {
        return {};
    }
    set draw(_d) { }
    get destination() {
        return {};
    }
    set destination(_d) { }
    now() {
        return 0;
    }
    immediate() {
        return 0;
    }
}

/**
 * Make the property not writable using `defineProperty`. Internal use only.
 */
function readOnly(target, property) {
    if (isArray(property)) {
        property.forEach(str => readOnly(target, str));
    }
    else {
        Object.defineProperty(target, property, {
            enumerable: true,
            writable: false,
        });
    }
}
/**
 * Make an attribute writeable. Internal use only.
 */
function writable(target, property) {
    if (isArray(property)) {
        property.forEach(str => writable(target, str));
    }
    else {
        Object.defineProperty(target, property, {
            writable: true,
        });
    }
}
const noOp = () => {
    // no operation here!
};

/**
 * AudioBuffer loading and storage. ToneAudioBuffer is used internally by all
 * classes that make requests for audio files such as Tone.Player,
 * Tone.Sampler and Tone.Convolver.
 * @example
 * const buffer = new Tone.ToneAudioBuffer("https://tonejs.github.io/audio/casio/A1.mp3", () => {
 * 	console.log("loaded");
 * });
 * @category Core
 */
class ToneAudioBuffer extends Tone {
    constructor() {
        super();
        this.name = "ToneAudioBuffer";
        /**
         * Callback when the buffer is loaded.
         */
        this.onload = noOp;
        const options = optionsFromArguments(ToneAudioBuffer.getDefaults(), arguments, ["url", "onload", "onerror"]);
        this.reverse = options.reverse;
        this.onload = options.onload;
        if (options.url && isAudioBuffer(options.url) || options.url instanceof ToneAudioBuffer) {
            this.set(options.url);
        }
        else if (isString(options.url)) {
            // initiate the download
            this.load(options.url).catch(options.onerror);
        }
    }
    static getDefaults() {
        return {
            onerror: noOp,
            onload: noOp,
            reverse: false,
        };
    }
    /**
     * The sample rate of the AudioBuffer
     */
    get sampleRate() {
        if (this._buffer) {
            return this._buffer.sampleRate;
        }
        else {
            return getContext().sampleRate;
        }
    }
    /**
     * Pass in an AudioBuffer or ToneAudioBuffer to set the value of this buffer.
     */
    set(buffer) {
        if (buffer instanceof ToneAudioBuffer) {
            // if it's loaded, set it
            if (buffer.loaded) {
                this._buffer = buffer.get();
            }
            else {
                // otherwise when it's loaded, invoke it's callback
                buffer.onload = () => {
                    this.set(buffer);
                    this.onload(this);
                };
            }
        }
        else {
            this._buffer = buffer;
        }
        // reverse it initially
        if (this._reversed) {
            this._reverse();
        }
        return this;
    }
    /**
     * The audio buffer stored in the object.
     */
    get() {
        return this._buffer;
    }
    /**
     * Makes an fetch request for the selected url then decodes the file as an audio buffer.
     * Invokes the callback once the audio buffer loads.
     * @param url The url of the buffer to load. filetype support depends on the browser.
     * @returns A Promise which resolves with this ToneAudioBuffer
     */
    load(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const doneLoading = ToneAudioBuffer.load(url).then(audioBuffer => {
                this.set(audioBuffer);
                // invoke the onload method
                this.onload(this);
            });
            ToneAudioBuffer.downloads.push(doneLoading);
            try {
                yield doneLoading;
            }
            finally {
                // remove the downloaded file
                const index = ToneAudioBuffer.downloads.indexOf(doneLoading);
                ToneAudioBuffer.downloads.splice(index, 1);
            }
            return this;
        });
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this._buffer = undefined;
        return this;
    }
    /**
     * Set the audio buffer from the array.
     * To create a multichannel AudioBuffer, pass in a multidimensional array.
     * @param array The array to fill the audio buffer
     */
    fromArray(array) {
        const isMultidimensional = isArray(array) && array[0].length > 0;
        const channels = isMultidimensional ? array.length : 1;
        const len = isMultidimensional ? array[0].length : array.length;
        const context = getContext();
        const buffer = context.createBuffer(channels, len, context.sampleRate);
        const multiChannelArray = !isMultidimensional && channels === 1 ?
            [array] : array;
        for (let c = 0; c < channels; c++) {
            buffer.copyToChannel(multiChannelArray[c], c);
        }
        this._buffer = buffer;
        return this;
    }
    /**
     * Sums multiple channels into 1 channel
     * @param chanNum Optionally only copy a single channel from the array.
     */
    toMono(chanNum) {
        if (isNumber(chanNum)) {
            this.fromArray(this.toArray(chanNum));
        }
        else {
            let outputArray = new Float32Array(this.length);
            const numChannels = this.numberOfChannels;
            for (let channel = 0; channel < numChannels; channel++) {
                const channelArray = this.toArray(channel);
                for (let i = 0; i < channelArray.length; i++) {
                    outputArray[i] += channelArray[i];
                }
            }
            // divide by the number of channels
            outputArray = outputArray.map(sample => sample / numChannels);
            this.fromArray(outputArray);
        }
        return this;
    }
    /**
     * Get the buffer as an array. Single channel buffers will return a 1-dimensional
     * Float32Array, and multichannel buffers will return multidimensional arrays.
     * @param channel Optionally only copy a single channel from the array.
     */
    toArray(channel) {
        if (isNumber(channel)) {
            return this.getChannelData(channel);
        }
        else if (this.numberOfChannels === 1) {
            return this.toArray(0);
        }
        else {
            const ret = [];
            for (let c = 0; c < this.numberOfChannels; c++) {
                ret[c] = this.getChannelData(c);
            }
            return ret;
        }
    }
    /**
     * Returns the Float32Array representing the PCM audio data for the specific channel.
     * @param  channel  The channel number to return
     * @return The audio as a TypedArray
     */
    getChannelData(channel) {
        if (this._buffer) {
            return this._buffer.getChannelData(channel);
        }
        else {
            return new Float32Array(0);
        }
    }
    /**
     * Cut a subsection of the array and return a buffer of the
     * subsection. Does not modify the original buffer
     * @param start The time to start the slice
     * @param end The end time to slice. If none is given will default to the end of the buffer
     */
    slice(start, end = this.duration) {
        const startSamples = Math.floor(start * this.sampleRate);
        const endSamples = Math.floor(end * this.sampleRate);
        assert(startSamples < endSamples, "The start time must be less than the end time");
        const length = endSamples - startSamples;
        const retBuffer = getContext().createBuffer(this.numberOfChannels, length, this.sampleRate);
        for (let channel = 0; channel < this.numberOfChannels; channel++) {
            retBuffer.copyToChannel(this.getChannelData(channel).subarray(startSamples, endSamples), channel);
        }
        return new ToneAudioBuffer(retBuffer);
    }
    /**
     * Reverse the buffer.
     */
    _reverse() {
        if (this.loaded) {
            for (let i = 0; i < this.numberOfChannels; i++) {
                this.getChannelData(i).reverse();
            }
        }
        return this;
    }
    /**
     * If the buffer is loaded or not
     */
    get loaded() {
        return this.length > 0;
    }
    /**
     * The duration of the buffer in seconds.
     */
    get duration() {
        if (this._buffer) {
            return this._buffer.duration;
        }
        else {
            return 0;
        }
    }
    /**
     * The length of the buffer in samples
     */
    get length() {
        if (this._buffer) {
            return this._buffer.length;
        }
        else {
            return 0;
        }
    }
    /**
     * The number of discrete audio channels. Returns 0 if no buffer is loaded.
     */
    get numberOfChannels() {
        if (this._buffer) {
            return this._buffer.numberOfChannels;
        }
        else {
            return 0;
        }
    }
    /**
     * Reverse the buffer.
     */
    get reverse() {
        return this._reversed;
    }
    set reverse(rev) {
        if (this._reversed !== rev) {
            this._reversed = rev;
            this._reverse();
        }
    }
    /**
     * Create a ToneAudioBuffer from the array. To create a multichannel AudioBuffer,
     * pass in a multidimensional array.
     * @param array The array to fill the audio buffer
     * @return A ToneAudioBuffer created from the array
     */
    static fromArray(array) {
        return (new ToneAudioBuffer()).fromArray(array);
    }
    /**
     * Creates a ToneAudioBuffer from a URL, returns a promise which resolves to a ToneAudioBuffer
     * @param  url The url to load.
     * @return A promise which resolves to a ToneAudioBuffer
     */
    static fromUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = new ToneAudioBuffer();
            return yield buffer.load(url);
        });
    }
    /**
     * Loads a url using fetch and returns the AudioBuffer.
     */
    static load(url) {
        return __awaiter(this, void 0, void 0, function* () {
            // test if the url contains multiple extensions
            const matches = url.match(/\[([^\]\[]+\|.+)\]$/);
            if (matches) {
                const extensions = matches[1].split("|");
                let extension = extensions[0];
                for (const ext of extensions) {
                    if (ToneAudioBuffer.supportsType(ext)) {
                        extension = ext;
                        break;
                    }
                }
                url = url.replace(matches[0], extension);
            }
            // make sure there is a slash between the baseUrl and the url
            const baseUrl = ToneAudioBuffer.baseUrl === "" || ToneAudioBuffer.baseUrl.endsWith("/") ? ToneAudioBuffer.baseUrl : ToneAudioBuffer.baseUrl + "/";
            const response = yield fetch(baseUrl + url);
            if (!response.ok) {
                throw new Error(`could not load url: ${url}`);
            }
            const arrayBuffer = yield response.arrayBuffer();
            const audioBuffer = yield getContext().decodeAudioData(arrayBuffer);
            return audioBuffer;
        });
    }
    /**
     * Checks a url's extension to see if the current browser can play that file type.
     * @param url The url/extension to test
     * @return If the file extension can be played
     * @static
     * @example
     * Tone.ToneAudioBuffer.supportsType("wav"); // returns true
     * Tone.ToneAudioBuffer.supportsType("path/to/file.wav"); // returns true
     */
    static supportsType(url) {
        const extensions = url.split(".");
        const extension = extensions[extensions.length - 1];
        const response = document.createElement("audio").canPlayType("audio/" + extension);
        return response !== "";
    }
    /**
     * Returns a Promise which resolves when all of the buffers have loaded
     */
    static loaded() {
        return __awaiter(this, void 0, void 0, function* () {
            // this makes sure that the function is always async
            yield Promise.resolve();
            while (ToneAudioBuffer.downloads.length) {
                yield ToneAudioBuffer.downloads[0];
            }
        });
    }
}
//-------------------------------------
// STATIC METHODS
//-------------------------------------
/**
 * A path which is prefixed before every url.
 */
ToneAudioBuffer.baseUrl = "";
/**
 * All of the downloads
 */
ToneAudioBuffer.downloads = [];

/**
 * Wrapper around the OfflineAudioContext
 * @category Core
 * @example
 * // generate a single channel, 0.5 second buffer
 * const context = new Tone.OfflineContext(1, 0.5, 44100);
 * const osc = new Tone.Oscillator({ context });
 * context.render().then(buffer => {
 * 	console.log(buffer.numberOfChannels, buffer.duration);
 * });
 */
class OfflineContext extends Context {
    constructor() {
        super({
            clockSource: "offline",
            context: isOfflineAudioContext(arguments[0]) ?
                arguments[0] : createOfflineAudioContext(arguments[0], arguments[1] * arguments[2], arguments[2]),
            lookAhead: 0,
            updateInterval: isOfflineAudioContext(arguments[0]) ?
                128 / arguments[0].sampleRate : 128 / arguments[2],
        });
        this.name = "OfflineContext";
        /**
         * An artificial clock source
         */
        this._currentTime = 0;
        this.isOffline = true;
        this._duration = isOfflineAudioContext(arguments[0]) ?
            arguments[0].length / arguments[0].sampleRate : arguments[1];
    }
    /**
     * Override the now method to point to the internal clock time
     */
    now() {
        return this._currentTime;
    }
    /**
     * Same as this.now()
     */
    get currentTime() {
        return this._currentTime;
    }
    /**
     * Render just the clock portion of the audio context.
     */
    _renderClock(asynchronous) {
        return __awaiter(this, void 0, void 0, function* () {
            let index = 0;
            while (this._duration - this._currentTime >= 0) {
                // invoke all the callbacks on that time
                this.emit("tick");
                // increment the clock in block-sized chunks
                this._currentTime += 128 / this.sampleRate;
                // yield once a second of audio
                index++;
                const yieldEvery = Math.floor(this.sampleRate / 128);
                if (asynchronous && index % yieldEvery === 0) {
                    yield new Promise(done => setTimeout(done, 1));
                }
            }
        });
    }
    /**
     * Render the output of the OfflineContext
     * @param asynchronous If the clock should be rendered asynchronously, which will not block the main thread, but be slightly slower.
     */
    render(asynchronous = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.workletsAreReady();
            yield this._renderClock(asynchronous);
            const buffer = yield this._context.startRendering();
            return new ToneAudioBuffer(buffer);
        });
    }
    /**
     * Close the context
     */
    close() {
        return Promise.resolve();
    }
}

/**
 * This dummy context is used to avoid throwing immediate errors when importing in Node.js
 */
const dummyContext = new DummyContext();
/**
 * The global audio context which is getable and assignable through
 * getContext and setContext
 */
let globalContext = dummyContext;
/**
 * Returns the default system-wide [[Context]]
 * @category Core
 */
function getContext() {
    if (globalContext === dummyContext && hasAudioContext) {
        setContext(new Context());
    }
    return globalContext;
}
/**
 * Set the default audio context
 * @category Core
 */
function setContext(context) {
    if (isAudioContext(context)) {
        globalContext = new Context(context);
    }
    else if (isOfflineAudioContext(context)) {
        globalContext = new OfflineContext(context);
    }
    else {
        globalContext = context;
    }
}
/**
 * Most browsers will not play _any_ audio until a user
 * clicks something (like a play button). Invoke this method
 * on a click or keypress event handler to start the audio context.
 * More about the Autoplay policy
 * [here](https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio)
 * @example
 * document.querySelector("button").addEventListener("click", async () => {
 * 	await Tone.start();
 * 	console.log("context started");
 * });
 * @category Core
 */
function start() {
    return globalContext.resume();
}
/**
 * Log Tone.js + version in the console.
 */
if (theWindow && !theWindow.TONE_SILENCE_LOGGING) {
    let prefix = "v";
    const printString = ` * Tone.js ${prefix}${version} * `;
    // eslint-disable-next-line no-console
    console.log(`%c${printString}`, "background: #000; color: #fff");
}

/**
 * Equal power gain scale. Good for cross-fading.
 * @param  percent (0-1)
 */
/**
 * Convert decibels into gain.
 */
function dbToGain(db) {
    return Math.pow(10, db / 20);
}
/**
 * Convert gain to decibels.
 */
function gainToDb(gain) {
    return 20 * (Math.log(gain) / Math.LN10);
}
/**
 * Convert an interval (in semitones) to a frequency ratio.
 * @param interval the number of semitones above the base note
 * @example
 * Tone.intervalToFrequencyRatio(0); // 1
 * Tone.intervalToFrequencyRatio(12); // 2
 * Tone.intervalToFrequencyRatio(-12); // 0.5
 */
function intervalToFrequencyRatio(interval) {
    return Math.pow(2, (interval / 12));
}
/**
 * The Global [concert tuning pitch](https://en.wikipedia.org/wiki/Concert_pitch) which is used
 * to generate all the other pitch values from notes. A4's values in Hertz.
 */
let A4 = 440;
function getA4() {
    return A4;
}
function setA4(freq) {
    A4 = freq;
}
/**
 * Convert a frequency value to a MIDI note.
 * @param frequency The value to frequency value to convert.
 * @example
 * Tone.ftom(440); // returns 69
 */
function ftom(frequency) {
    return Math.round(ftomf(frequency));
}
/**
 * Convert a frequency to a floating point midi value
 */
function ftomf(frequency) {
    return 69 + 12 * Math.log2(frequency / A4);
}
/**
 * Convert a MIDI note to frequency value.
 * @param  midi The midi number to convert.
 * @return The corresponding frequency value
 * @example
 * Tone.mtof(69); // 440
 */
function mtof(midi) {
    return A4 * Math.pow(2, (midi - 69) / 12);
}

/**
 * TimeBase is a flexible encoding of time which can be evaluated to and from a string.
 */
class TimeBaseClass extends Tone {
    /**
     * @param context The context associated with the time value. Used to compute
     * Transport and context-relative timing.
     * @param  value  The time value as a number, string or object
     * @param  units  Unit values
     */
    constructor(context, value, units) {
        super();
        /**
         * The default units
         */
        this.defaultUnits = "s";
        this._val = value;
        this._units = units;
        this.context = context;
        this._expressions = this._getExpressions();
    }
    /**
     * All of the time encoding expressions
     */
    _getExpressions() {
        return {
            hz: {
                method: (value) => {
                    return this._frequencyToUnits(parseFloat(value));
                },
                regexp: /^(\d+(?:\.\d+)?)hz$/i,
            },
            i: {
                method: (value) => {
                    return this._ticksToUnits(parseInt(value, 10));
                },
                regexp: /^(\d+)i$/i,
            },
            m: {
                method: (value) => {
                    return this._beatsToUnits(parseInt(value, 10) * this._getTimeSignature());
                },
                regexp: /^(\d+)m$/i,
            },
            n: {
                method: (value, dot) => {
                    const numericValue = parseInt(value, 10);
                    const scalar = dot === "." ? 1.5 : 1;
                    if (numericValue === 1) {
                        return this._beatsToUnits(this._getTimeSignature()) * scalar;
                    }
                    else {
                        return this._beatsToUnits(4 / numericValue) * scalar;
                    }
                },
                regexp: /^(\d+)n(\.?)$/i,
            },
            number: {
                method: (value) => {
                    return this._expressions[this.defaultUnits].method.call(this, value);
                },
                regexp: /^(\d+(?:\.\d+)?)$/,
            },
            s: {
                method: (value) => {
                    return this._secondsToUnits(parseFloat(value));
                },
                regexp: /^(\d+(?:\.\d+)?)s$/,
            },
            samples: {
                method: (value) => {
                    return parseInt(value, 10) / this.context.sampleRate;
                },
                regexp: /^(\d+)samples$/,
            },
            t: {
                method: (value) => {
                    const numericValue = parseInt(value, 10);
                    return this._beatsToUnits(8 / (Math.floor(numericValue) * 3));
                },
                regexp: /^(\d+)t$/i,
            },
            tr: {
                method: (m, q, s) => {
                    let total = 0;
                    if (m && m !== "0") {
                        total += this._beatsToUnits(this._getTimeSignature() * parseFloat(m));
                    }
                    if (q && q !== "0") {
                        total += this._beatsToUnits(parseFloat(q));
                    }
                    if (s && s !== "0") {
                        total += this._beatsToUnits(parseFloat(s) / 4);
                    }
                    return total;
                },
                regexp: /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):?(\d+(?:\.\d+)?)?$/,
            },
        };
    }
    //-------------------------------------
    // 	VALUE OF
    //-------------------------------------
    /**
     * Evaluate the time value. Returns the time in seconds.
     */
    valueOf() {
        if (this._val instanceof TimeBaseClass) {
            this.fromType(this._val);
        }
        if (isUndef(this._val)) {
            return this._noArg();
        }
        else if (isString(this._val) && isUndef(this._units)) {
            for (const units in this._expressions) {
                if (this._expressions[units].regexp.test(this._val.trim())) {
                    this._units = units;
                    break;
                }
            }
        }
        else if (isObject(this._val)) {
            let total = 0;
            for (const typeName in this._val) {
                if (isDefined(this._val[typeName])) {
                    const quantity = this._val[typeName];
                    // @ts-ignore
                    const time = (new this.constructor(this.context, typeName)).valueOf() * quantity;
                    total += time;
                }
            }
            return total;
        }
        if (isDefined(this._units)) {
            const expr = this._expressions[this._units];
            const matching = this._val.toString().trim().match(expr.regexp);
            if (matching) {
                return expr.method.apply(this, matching.slice(1));
            }
            else {
                return expr.method.call(this, this._val);
            }
        }
        else if (isString(this._val)) {
            return parseFloat(this._val);
        }
        else {
            return this._val;
        }
    }
    //-------------------------------------
    // 	UNIT CONVERSIONS
    //-------------------------------------
    /**
     * Returns the value of a frequency in the current units
     */
    _frequencyToUnits(freq) {
        return 1 / freq;
    }
    /**
     * Return the value of the beats in the current units
     */
    _beatsToUnits(beats) {
        return (60 / this._getBpm()) * beats;
    }
    /**
     * Returns the value of a second in the current units
     */
    _secondsToUnits(seconds) {
        return seconds;
    }
    /**
     * Returns the value of a tick in the current time units
     */
    _ticksToUnits(ticks) {
        return (ticks * (this._beatsToUnits(1)) / this._getPPQ());
    }
    /**
     * With no arguments, return 'now'
     */
    _noArg() {
        return this._now();
    }
    //-------------------------------------
    // 	TEMPO CONVERSIONS
    //-------------------------------------
    /**
     * Return the bpm
     */
    _getBpm() {
        return this.context.transport.bpm.value;
    }
    /**
     * Return the timeSignature
     */
    _getTimeSignature() {
        return this.context.transport.timeSignature;
    }
    /**
     * Return the PPQ or 192 if Transport is not available
     */
    _getPPQ() {
        return this.context.transport.PPQ;
    }
    //-------------------------------------
    // 	CONVERSION INTERFACE
    //-------------------------------------
    /**
     * Coerce a time type into this units type.
     * @param type Any time type units
     */
    fromType(type) {
        this._units = undefined;
        switch (this.defaultUnits) {
            case "s":
                this._val = type.toSeconds();
                break;
            case "i":
                this._val = type.toTicks();
                break;
            case "hz":
                this._val = type.toFrequency();
                break;
            case "midi":
                this._val = type.toMidi();
                break;
        }
        return this;
    }
    /**
     * Return the value in hertz
     */
    toFrequency() {
        return 1 / this.toSeconds();
    }
    /**
     * Return the time in samples
     */
    toSamples() {
        return this.toSeconds() * this.context.sampleRate;
    }
    /**
     * Return the time in milliseconds.
     */
    toMilliseconds() {
        return this.toSeconds() * 1000;
    }
}

/**
 * TimeClass is a primitive type for encoding and decoding Time values.
 * TimeClass can be passed into the parameter of any method which takes time as an argument.
 * @param  val    The time value.
 * @param  units  The units of the value.
 * @example
 * const time = Tone.Time("4n"); // a quarter note
 * @category Unit
 */
class TimeClass extends TimeBaseClass {
    constructor() {
        super(...arguments);
        this.name = "TimeClass";
    }
    _getExpressions() {
        return Object.assign(super._getExpressions(), {
            now: {
                method: (capture) => {
                    return this._now() + new this.constructor(this.context, capture).valueOf();
                },
                regexp: /^\+(.+)/,
            },
            quantize: {
                method: (capture) => {
                    const quantTo = new TimeClass(this.context, capture).valueOf();
                    return this._secondsToUnits(this.context.transport.nextSubdivision(quantTo));
                },
                regexp: /^@(.+)/,
            },
        });
    }
    /**
     * Quantize the time by the given subdivision. Optionally add a
     * percentage which will move the time value towards the ideal
     * quantized value by that percentage.
     * @param  subdiv    The subdivision to quantize to
     * @param  percent  Move the time value towards the quantized value by a percentage.
     * @example
     * Tone.Time(21).quantize(2); // returns 22
     * Tone.Time(0.6).quantize("4n", 0.5); // returns 0.55
     */
    quantize(subdiv, percent = 1) {
        const subdivision = new this.constructor(this.context, subdiv).valueOf();
        const value = this.valueOf();
        const multiple = Math.round(value / subdivision);
        const ideal = multiple * subdivision;
        const diff = ideal - value;
        return value + diff * percent;
    }
    //-------------------------------------
    // CONVERSIONS
    //-------------------------------------
    /**
     * Convert a Time to Notation. The notation values are will be the
     * closest representation between 1m to 128th note.
     * @return {Notation}
     * @example
     * // if the Transport is at 120bpm:
     * Tone.Time(2).toNotation(); // returns "1m"
     */
    toNotation() {
        const time = this.toSeconds();
        const testNotations = ["1m"];
        for (let power = 1; power < 9; power++) {
            const subdiv = Math.pow(2, power);
            testNotations.push(subdiv + "n.");
            testNotations.push(subdiv + "n");
            testNotations.push(subdiv + "t");
        }
        testNotations.push("0");
        // find the closets notation representation
        let closest = testNotations[0];
        let closestSeconds = new TimeClass(this.context, testNotations[0]).toSeconds();
        testNotations.forEach(notation => {
            const notationSeconds = new TimeClass(this.context, notation).toSeconds();
            if (Math.abs(notationSeconds - time) < Math.abs(closestSeconds - time)) {
                closest = notation;
                closestSeconds = notationSeconds;
            }
        });
        return closest;
    }
    /**
     * Return the time encoded as Bars:Beats:Sixteenths.
     */
    toBarsBeatsSixteenths() {
        const quarterTime = this._beatsToUnits(1);
        let quarters = this.valueOf() / quarterTime;
        quarters = parseFloat(quarters.toFixed(4));
        const measures = Math.floor(quarters / this._getTimeSignature());
        let sixteenths = (quarters % 1) * 4;
        quarters = Math.floor(quarters) % this._getTimeSignature();
        const sixteenthString = sixteenths.toString();
        if (sixteenthString.length > 3) {
            // the additional parseFloat removes insignificant trailing zeroes
            sixteenths = parseFloat(parseFloat(sixteenthString).toFixed(3));
        }
        const progress = [measures, quarters, sixteenths];
        return progress.join(":");
    }
    /**
     * Return the time in ticks.
     */
    toTicks() {
        const quarterTime = this._beatsToUnits(1);
        const quarters = this.valueOf() / quarterTime;
        return Math.round(quarters * this._getPPQ());
    }
    /**
     * Return the time in seconds.
     */
    toSeconds() {
        return this.valueOf();
    }
    /**
     * Return the value as a midi note.
     */
    toMidi() {
        return ftom(this.toFrequency());
    }
    _now() {
        return this.context.now();
    }
}
/**
 * Create a TimeClass from a time string or number. The time is computed against the
 * global Tone.Context. To use a specific context, use [[TimeClass]]
 * @param value A value which represents time
 * @param units The value's units if they can't be inferred by the value.
 * @category Unit
 * @example
 * const time = Tone.Time("4n").toSeconds();
 * console.log(time);
 * @example
 * const note = Tone.Time(1).toNotation();
 * console.log(note);
 * @example
 * const freq = Tone.Time(0.5).toFrequency();
 * console.log(freq);
 */
function Time(value, units) {
    return new TimeClass(getContext(), value, units);
}

/**
 * Frequency is a primitive type for encoding Frequency values.
 * Eventually all time values are evaluated to hertz using the `valueOf` method.
 * @example
 * Tone.Frequency("C3"); // 261
 * Tone.Frequency(38, "midi");
 * Tone.Frequency("C3").transpose(4);
 * @category Unit
 */
class FrequencyClass extends TimeClass {
    constructor() {
        super(...arguments);
        this.name = "Frequency";
        this.defaultUnits = "hz";
    }
    /**
     * The [concert tuning pitch](https://en.wikipedia.org/wiki/Concert_pitch) which is used
     * to generate all the other pitch values from notes. A4's values in Hertz.
     */
    static get A4() {
        return getA4();
    }
    static set A4(freq) {
        setA4(freq);
    }
    //-------------------------------------
    // 	AUGMENT BASE EXPRESSIONS
    //-------------------------------------
    _getExpressions() {
        return Object.assign({}, super._getExpressions(), {
            midi: {
                regexp: /^(\d+(?:\.\d+)?midi)/,
                method(value) {
                    if (this.defaultUnits === "midi") {
                        return value;
                    }
                    else {
                        return FrequencyClass.mtof(value);
                    }
                },
            },
            note: {
                regexp: /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i,
                method(pitch, octave) {
                    const index = noteToScaleIndex[pitch.toLowerCase()];
                    const noteNumber = index + (parseInt(octave, 10) + 1) * 12;
                    if (this.defaultUnits === "midi") {
                        return noteNumber;
                    }
                    else {
                        return FrequencyClass.mtof(noteNumber);
                    }
                },
            },
            tr: {
                regexp: /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):?(\d+(?:\.\d+)?)?/,
                method(m, q, s) {
                    let total = 1;
                    if (m && m !== "0") {
                        total *= this._beatsToUnits(this._getTimeSignature() * parseFloat(m));
                    }
                    if (q && q !== "0") {
                        total *= this._beatsToUnits(parseFloat(q));
                    }
                    if (s && s !== "0") {
                        total *= this._beatsToUnits(parseFloat(s) / 4);
                    }
                    return total;
                },
            },
        });
    }
    //-------------------------------------
    // 	EXPRESSIONS
    //-------------------------------------
    /**
     * Transposes the frequency by the given number of semitones.
     * @return  A new transposed frequency
     * @example
     * Tone.Frequency("A4").transpose(3); // "C5"
     */
    transpose(interval) {
        return new FrequencyClass(this.context, this.valueOf() * intervalToFrequencyRatio(interval));
    }
    /**
     * Takes an array of semitone intervals and returns
     * an array of frequencies transposed by those intervals.
     * @return  Returns an array of Frequencies
     * @example
     * Tone.Frequency("A4").harmonize([0, 3, 7]); // ["A4", "C5", "E5"]
     */
    harmonize(intervals) {
        return intervals.map(interval => {
            return this.transpose(interval);
        });
    }
    //-------------------------------------
    // 	UNIT CONVERSIONS
    //-------------------------------------
    /**
     * Return the value of the frequency as a MIDI note
     * @example
     * Tone.Frequency("C4").toMidi(); // 60
     */
    toMidi() {
        return ftom(this.valueOf());
    }
    /**
     * Return the value of the frequency in Scientific Pitch Notation
     * @example
     * Tone.Frequency(69, "midi").toNote(); // "A4"
     */
    toNote() {
        const freq = this.toFrequency();
        const log = Math.log2(freq / FrequencyClass.A4);
        let noteNumber = Math.round(12 * log) + 57;
        const octave = Math.floor(noteNumber / 12);
        if (octave < 0) {
            noteNumber += -12 * octave;
        }
        const noteName = scaleIndexToNote[noteNumber % 12];
        return noteName + octave.toString();
    }
    /**
     * Return the duration of one cycle in seconds.
     */
    toSeconds() {
        return 1 / super.toSeconds();
    }
    /**
     * Return the duration of one cycle in ticks
     */
    toTicks() {
        const quarterTime = this._beatsToUnits(1);
        const quarters = this.valueOf() / quarterTime;
        return Math.floor(quarters * this._getPPQ());
    }
    //-------------------------------------
    // 	UNIT CONVERSIONS HELPERS
    //-------------------------------------
    /**
     * With no arguments, return 0
     */
    _noArg() {
        return 0;
    }
    /**
     * Returns the value of a frequency in the current units
     */
    _frequencyToUnits(freq) {
        return freq;
    }
    /**
     * Returns the value of a tick in the current time units
     */
    _ticksToUnits(ticks) {
        return 1 / ((ticks * 60) / (this._getBpm() * this._getPPQ()));
    }
    /**
     * Return the value of the beats in the current units
     */
    _beatsToUnits(beats) {
        return 1 / super._beatsToUnits(beats);
    }
    /**
     * Returns the value of a second in the current units
     */
    _secondsToUnits(seconds) {
        return 1 / seconds;
    }
    /**
     * Convert a MIDI note to frequency value.
     * @param  midi The midi number to convert.
     * @return The corresponding frequency value
     */
    static mtof(midi) {
        return mtof(midi);
    }
    /**
     * Convert a frequency value to a MIDI note.
     * @param frequency The value to frequency value to convert.
     */
    static ftom(frequency) {
        return ftom(frequency);
    }
}
//-------------------------------------
// 	FREQUENCY CONVERSIONS
//-------------------------------------
/**
 * Note to scale index.
 * @hidden
 */
const noteToScaleIndex = {
    cbb: -2, cb: -1, c: 0, "c#": 1, cx: 2,
    dbb: 0, db: 1, d: 2, "d#": 3, dx: 4,
    ebb: 2, eb: 3, e: 4, "e#": 5, ex: 6,
    fbb: 3, fb: 4, f: 5, "f#": 6, fx: 7,
    gbb: 5, gb: 6, g: 7, "g#": 8, gx: 9,
    abb: 7, ab: 8, a: 9, "a#": 10, ax: 11,
    bbb: 9, bb: 10, b: 11, "b#": 12, bx: 13,
};
/**
 * scale index to note (sharps)
 * @hidden
 */
const scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
/**
 * Convert a value into a FrequencyClass object.
 * @category Unit
 * @example
 * const midi = Tone.Frequency("C3").toMidi();
 * console.log(midi);
 * @example
 * const hertz = Tone.Frequency(38, "midi").toFrequency();
 * console.log(hertz);
 */
function Frequency(value, units) {
    return new FrequencyClass(getContext(), value, units);
}

/**
 * TransportTime is a the time along the Transport's
 * timeline. It is similar to Tone.Time, but instead of evaluating
 * against the AudioContext's clock, it is evaluated against
 * the Transport's position. See [TransportTime wiki](https://github.com/Tonejs/Tone.js/wiki/TransportTime).
 * @category Unit
 */
class TransportTimeClass extends TimeClass {
    constructor() {
        super(...arguments);
        this.name = "TransportTime";
    }
    /**
     * Return the current time in whichever context is relevant
     */
    _now() {
        return this.context.transport.seconds;
    }
}
/**
 * TransportTime is a the time along the Transport's
 * timeline. It is similar to [[Time]], but instead of evaluating
 * against the AudioContext's clock, it is evaluated against
 * the Transport's position. See [TransportTime wiki](https://github.com/Tonejs/Tone.js/wiki/TransportTime).
 * @category Unit
 */
function TransportTime(value, units) {
    return new TransportTimeClass(getContext(), value, units);
}

/**
 * The Base class for all nodes that have an AudioContext.
 */
class ToneWithContext extends Tone {
    constructor() {
        super();
        const options = optionsFromArguments(ToneWithContext.getDefaults(), arguments, ["context"]);
        if (this.defaultContext) {
            this.context = this.defaultContext;
        }
        else {
            this.context = options.context;
        }
    }
    static getDefaults() {
        return {
            context: getContext(),
        };
    }
    /**
     * Return the current time of the Context clock plus the lookAhead.
     * @example
     * setInterval(() => {
     * 	console.log(Tone.now());
     * }, 100);
     */
    now() {
        return this.context.currentTime + this.context.lookAhead;
    }
    /**
     * Return the current time of the Context clock without any lookAhead.
     * @example
     * setInterval(() => {
     * 	console.log(Tone.immediate());
     * }, 100);
     */
    immediate() {
        return this.context.currentTime;
    }
    /**
     * The duration in seconds of one sample.
     * @example
     * console.log(Tone.Transport.sampleTime);
     */
    get sampleTime() {
        return 1 / this.context.sampleRate;
    }
    /**
     * The number of seconds of 1 processing block (128 samples)
     * @example
     * console.log(Tone.Destination.blockTime);
     */
    get blockTime() {
        return 128 / this.context.sampleRate;
    }
    /**
     * Convert the incoming time to seconds.
     * This is calculated against the current [[Tone.Transport]] bpm
     * @example
     * const gain = new Tone.Gain();
     * setInterval(() => console.log(gain.toSeconds("4n")), 100);
     * // ramp the tempo to 60 bpm over 30 seconds
     * Tone.getTransport().bpm.rampTo(60, 30);
     */
    toSeconds(time) {
        return new TimeClass(this.context, time).toSeconds();
    }
    /**
     * Convert the input to a frequency number
     * @example
     * const gain = new Tone.Gain();
     * console.log(gain.toFrequency("4n"));
     */
    toFrequency(freq) {
        return new FrequencyClass(this.context, freq).toFrequency();
    }
    /**
     * Convert the input time into ticks
     * @example
     * const gain = new Tone.Gain();
     * console.log(gain.toTicks("4n"));
     */
    toTicks(time) {
        return new TransportTimeClass(this.context, time).toTicks();
    }
    //-------------------------------------
    // 	GET/SET
    //-------------------------------------
    /**
     * Get a subset of the properties which are in the partial props
     */
    _getPartialProperties(props) {
        const options = this.get();
        // remove attributes from the prop that are not in the partial
        Object.keys(options).forEach(name => {
            if (isUndef(props[name])) {
                delete options[name];
            }
        });
        return options;
    }
    /**
     * Get the object's attributes.
     * @example
     * const osc = new Tone.Oscillator();
     * console.log(osc.get());
     */
    get() {
        const defaults = getDefaultsFromInstance(this);
        Object.keys(defaults).forEach(attribute => {
            if (Reflect.has(this, attribute)) {
                const member = this[attribute];
                if (isDefined(member) && isDefined(member.value) && isDefined(member.setValueAtTime)) {
                    defaults[attribute] = member.value;
                }
                else if (member instanceof ToneWithContext) {
                    defaults[attribute] = member._getPartialProperties(defaults[attribute]);
                    // otherwise make sure it's a serializable type
                }
                else if (isArray(member) || isNumber(member) || isString(member) || isBoolean(member)) {
                    defaults[attribute] = member;
                }
                else {
                    // remove all undefined and unserializable attributes
                    delete defaults[attribute];
                }
            }
        });
        return defaults;
    }
    /**
     * Set multiple properties at once with an object.
     * @example
     * const filter = new Tone.Filter().toDestination();
     * // set values using an object
     * filter.set({
     * 	frequency: "C6",
     * 	type: "highpass"
     * });
     * const player = new Tone.Player("https://tonejs.github.io/audio/berklee/Analogsynth_octaves_highmid.mp3").connect(filter);
     * player.autostart = true;
     */
    set(props) {
        Object.keys(props).forEach(attribute => {
            if (Reflect.has(this, attribute) && isDefined(this[attribute])) {
                if (this[attribute] && isDefined(this[attribute].value) && isDefined(this[attribute].setValueAtTime)) {
                    // small optimization
                    if (this[attribute].value !== props[attribute]) {
                        this[attribute].value = props[attribute];
                    }
                }
                else if (this[attribute] instanceof ToneWithContext) {
                    this[attribute].set(props[attribute]);
                }
                else {
                    this[attribute] = props[attribute];
                }
            }
        });
        return this;
    }
}

/**
 * A Timeline State. Provides the methods: `setStateAtTime("state", time)` and `getValueAtTime(time)`
 * @param initial The initial state of the StateTimeline.  Defaults to `undefined`
 */
class StateTimeline extends Timeline {
    constructor(initial = "stopped") {
        super();
        this.name = "StateTimeline";
        this._initial = initial;
        this.setStateAtTime(this._initial, 0);
    }
    /**
     * Returns the scheduled state scheduled before or at
     * the given time.
     * @param  time  The time to query.
     * @return  The name of the state input in setStateAtTime.
     */
    getValueAtTime(time) {
        const event = this.get(time);
        if (event !== null) {
            return event.state;
        }
        else {
            return this._initial;
        }
    }
    /**
     * Add a state to the timeline.
     * @param  state The name of the state to set.
     * @param  time  The time to query.
     * @param options Any additional options that are needed in the timeline.
     */
    setStateAtTime(state, time, options) {
        assertRange(time, 0);
        this.add(Object.assign({}, options, {
            state,
            time,
        }));
        return this;
    }
    /**
     * Return the event before the time with the given state
     * @param  state The state to look for
     * @param  time  When to check before
     * @return  The event with the given state before the time
     */
    getLastState(state, time) {
        // time = this.toSeconds(time);
        const index = this._search(time);
        for (let i = index; i >= 0; i--) {
            const event = this._timeline[i];
            if (event.state === state) {
                return event;
            }
        }
    }
    /**
     * Return the event after the time with the given state
     * @param  state The state to look for
     * @param  time  When to check from
     * @return  The event with the given state after the time
     */
    getNextState(state, time) {
        // time = this.toSeconds(time);
        const index = this._search(time);
        if (index !== -1) {
            for (let i = index; i < this._timeline.length; i++) {
                const event = this._timeline[i];
                if (event.state === state) {
                    return event;
                }
            }
        }
    }
}

/**
 * Param wraps the native Web Audio's AudioParam to provide
 * additional unit conversion functionality. It also
 * serves as a base-class for classes which have a single,
 * automatable parameter.
 * @category Core
 */
class Param extends ToneWithContext {
    constructor() {
        super(optionsFromArguments(Param.getDefaults(), arguments, ["param", "units", "convert"]));
        this.name = "Param";
        this.overridden = false;
        /**
         * The minimum output value
         */
        this._minOutput = 1e-7;
        const options = optionsFromArguments(Param.getDefaults(), arguments, ["param", "units", "convert"]);
        assert(isDefined(options.param) &&
            (isAudioParam(options.param) || options.param instanceof Param), "param must be an AudioParam");
        while (!isAudioParam(options.param)) {
            options.param = options.param._param;
        }
        this._swappable = isDefined(options.swappable) ? options.swappable : false;
        if (this._swappable) {
            this.input = this.context.createGain();
            // initialize
            this._param = options.param;
            this.input.connect(this._param);
        }
        else {
            this._param = this.input = options.param;
        }
        this._events = new Timeline(1000);
        this._initialValue = this._param.defaultValue;
        this.units = options.units;
        this.convert = options.convert;
        this._minValue = options.minValue;
        this._maxValue = options.maxValue;
        // if the value is defined, set it immediately
        if (isDefined(options.value) && options.value !== this._toType(this._initialValue)) {
            this.setValueAtTime(options.value, 0);
        }
    }
    static getDefaults() {
        return Object.assign(ToneWithContext.getDefaults(), {
            convert: true,
            units: "number",
        });
    }
    get value() {
        const now = this.now();
        return this.getValueAtTime(now);
    }
    set value(value) {
        this.cancelScheduledValues(this.now());
        this.setValueAtTime(value, this.now());
    }
    get minValue() {
        // if it's not the default minValue, return it
        if (isDefined(this._minValue)) {
            return this._minValue;
        }
        else if (this.units === "time" || this.units === "frequency" ||
            this.units === "normalRange" || this.units === "positive" ||
            this.units === "transportTime" || this.units === "ticks" ||
            this.units === "bpm" || this.units === "hertz" || this.units === "samples") {
            return 0;
        }
        else if (this.units === "audioRange") {
            return -1;
        }
        else if (this.units === "decibels") {
            return -Infinity;
        }
        else {
            return this._param.minValue;
        }
    }
    get maxValue() {
        if (isDefined(this._maxValue)) {
            return this._maxValue;
        }
        else if (this.units === "normalRange" ||
            this.units === "audioRange") {
            return 1;
        }
        else {
            return this._param.maxValue;
        }
    }
    /**
     * Type guard based on the unit name
     */
    _is(arg, type) {
        return this.units === type;
    }
    /**
     * Make sure the value is always in the defined range
     */
    _assertRange(value) {
        if (isDefined(this.maxValue) && isDefined(this.minValue)) {
            assertRange(value, this._fromType(this.minValue), this._fromType(this.maxValue));
        }
        return value;
    }
    /**
     * Convert the given value from the type specified by Param.units
     * into the destination value (such as Gain or Frequency).
     */
    _fromType(val) {
        if (this.convert && !this.overridden) {
            if (this._is(val, "time")) {
                return this.toSeconds(val);
            }
            else if (this._is(val, "decibels")) {
                return dbToGain(val);
            }
            else if (this._is(val, "frequency")) {
                return this.toFrequency(val);
            }
            else {
                return val;
            }
        }
        else if (this.overridden) {
            // if it's overridden, should only schedule 0s
            return 0;
        }
        else {
            return val;
        }
    }
    /**
     * Convert the parameters value into the units specified by Param.units.
     */
    _toType(val) {
        if (this.convert && this.units === "decibels") {
            return gainToDb(val);
        }
        else {
            return val;
        }
    }
    //-------------------------------------
    // ABSTRACT PARAM INTERFACE
    // all docs are generated from ParamInterface.ts
    //-------------------------------------
    setValueAtTime(value, time) {
        const computedTime = this.toSeconds(time);
        const numericValue = this._fromType(value);
        assert(isFinite(numericValue) && isFinite(computedTime), `Invalid argument(s) to setValueAtTime: ${JSON.stringify(value)}, ${JSON.stringify(time)}`);
        this._assertRange(numericValue);
        this.log(this.units, "setValueAtTime", value, computedTime);
        this._events.add({
            time: computedTime,
            type: "setValueAtTime",
            value: numericValue,
        });
        this._param.setValueAtTime(numericValue, computedTime);
        return this;
    }
    getValueAtTime(time) {
        const computedTime = Math.max(this.toSeconds(time), 0);
        const after = this._events.getAfter(computedTime);
        const before = this._events.get(computedTime);
        let value = this._initialValue;
        // if it was set by
        if (before === null) {
            value = this._initialValue;
        }
        else if (before.type === "setTargetAtTime" && (after === null || after.type === "setValueAtTime")) {
            const previous = this._events.getBefore(before.time);
            let previousVal;
            if (previous === null) {
                previousVal = this._initialValue;
            }
            else {
                previousVal = previous.value;
            }
            if (before.type === "setTargetAtTime") {
                value = this._exponentialApproach(before.time, previousVal, before.value, before.constant, computedTime);
            }
        }
        else if (after === null) {
            value = before.value;
        }
        else if (after.type === "linearRampToValueAtTime" || after.type === "exponentialRampToValueAtTime") {
            let beforeValue = before.value;
            if (before.type === "setTargetAtTime") {
                const previous = this._events.getBefore(before.time);
                if (previous === null) {
                    beforeValue = this._initialValue;
                }
                else {
                    beforeValue = previous.value;
                }
            }
            if (after.type === "linearRampToValueAtTime") {
                value = this._linearInterpolate(before.time, beforeValue, after.time, after.value, computedTime);
            }
            else {
                value = this._exponentialInterpolate(before.time, beforeValue, after.time, after.value, computedTime);
            }
        }
        else {
            value = before.value;
        }
        return this._toType(value);
    }
    setRampPoint(time) {
        time = this.toSeconds(time);
        let currentVal = this.getValueAtTime(time);
        this.cancelAndHoldAtTime(time);
        if (this._fromType(currentVal) === 0) {
            currentVal = this._toType(this._minOutput);
        }
        this.setValueAtTime(currentVal, time);
        return this;
    }
    linearRampToValueAtTime(value, endTime) {
        const numericValue = this._fromType(value);
        const computedTime = this.toSeconds(endTime);
        assert(isFinite(numericValue) && isFinite(computedTime), `Invalid argument(s) to linearRampToValueAtTime: ${JSON.stringify(value)}, ${JSON.stringify(endTime)}`);
        this._assertRange(numericValue);
        this._events.add({
            time: computedTime,
            type: "linearRampToValueAtTime",
            value: numericValue,
        });
        this.log(this.units, "linearRampToValueAtTime", value, computedTime);
        this._param.linearRampToValueAtTime(numericValue, computedTime);
        return this;
    }
    exponentialRampToValueAtTime(value, endTime) {
        let numericValue = this._fromType(value);
        // the value can't be 0
        numericValue = EQ(numericValue, 0) ? this._minOutput : numericValue;
        this._assertRange(numericValue);
        const computedTime = this.toSeconds(endTime);
        assert(isFinite(numericValue) && isFinite(computedTime), `Invalid argument(s) to exponentialRampToValueAtTime: ${JSON.stringify(value)}, ${JSON.stringify(endTime)}`);
        // store the event
        this._events.add({
            time: computedTime,
            type: "exponentialRampToValueAtTime",
            value: numericValue,
        });
        this.log(this.units, "exponentialRampToValueAtTime", value, computedTime);
        this._param.exponentialRampToValueAtTime(numericValue, computedTime);
        return this;
    }
    exponentialRampTo(value, rampTime, startTime) {
        startTime = this.toSeconds(startTime);
        this.setRampPoint(startTime);
        this.exponentialRampToValueAtTime(value, startTime + this.toSeconds(rampTime));
        return this;
    }
    linearRampTo(value, rampTime, startTime) {
        startTime = this.toSeconds(startTime);
        this.setRampPoint(startTime);
        this.linearRampToValueAtTime(value, startTime + this.toSeconds(rampTime));
        return this;
    }
    targetRampTo(value, rampTime, startTime) {
        startTime = this.toSeconds(startTime);
        this.setRampPoint(startTime);
        this.exponentialApproachValueAtTime(value, startTime, rampTime);
        return this;
    }
    exponentialApproachValueAtTime(value, time, rampTime) {
        time = this.toSeconds(time);
        rampTime = this.toSeconds(rampTime);
        const timeConstant = Math.log(rampTime + 1) / Math.log(200);
        this.setTargetAtTime(value, time, timeConstant);
        // at 90% start a linear ramp to the final value
        this.cancelAndHoldAtTime(time + rampTime * 0.9);
        this.linearRampToValueAtTime(value, time + rampTime);
        return this;
    }
    setTargetAtTime(value, startTime, timeConstant) {
        const numericValue = this._fromType(value);
        // The value will never be able to approach without timeConstant > 0.
        assert(isFinite(timeConstant) && timeConstant > 0, "timeConstant must be a number greater than 0");
        const computedTime = this.toSeconds(startTime);
        this._assertRange(numericValue);
        assert(isFinite(numericValue) && isFinite(computedTime), `Invalid argument(s) to setTargetAtTime: ${JSON.stringify(value)}, ${JSON.stringify(startTime)}`);
        this._events.add({
            constant: timeConstant,
            time: computedTime,
            type: "setTargetAtTime",
            value: numericValue,
        });
        this.log(this.units, "setTargetAtTime", value, computedTime, timeConstant);
        this._param.setTargetAtTime(numericValue, computedTime, timeConstant);
        return this;
    }
    setValueCurveAtTime(values, startTime, duration, scaling = 1) {
        duration = this.toSeconds(duration);
        startTime = this.toSeconds(startTime);
        const startingValue = this._fromType(values[0]) * scaling;
        this.setValueAtTime(this._toType(startingValue), startTime);
        const segTime = duration / (values.length - 1);
        for (let i = 1; i < values.length; i++) {
            const numericValue = this._fromType(values[i]) * scaling;
            this.linearRampToValueAtTime(this._toType(numericValue), startTime + i * segTime);
        }
        return this;
    }
    cancelScheduledValues(time) {
        const computedTime = this.toSeconds(time);
        assert(isFinite(computedTime), `Invalid argument to cancelScheduledValues: ${JSON.stringify(time)}`);
        this._events.cancel(computedTime);
        this._param.cancelScheduledValues(computedTime);
        this.log(this.units, "cancelScheduledValues", computedTime);
        return this;
    }
    cancelAndHoldAtTime(time) {
        const computedTime = this.toSeconds(time);
        const valueAtTime = this._fromType(this.getValueAtTime(computedTime));
        // remove the schedule events
        assert(isFinite(computedTime), `Invalid argument to cancelAndHoldAtTime: ${JSON.stringify(time)}`);
        this.log(this.units, "cancelAndHoldAtTime", computedTime, "value=" + valueAtTime);
        // if there is an event at the given computedTime
        // and that even is not a "set"
        const before = this._events.get(computedTime);
        const after = this._events.getAfter(computedTime);
        if (before && EQ(before.time, computedTime)) {
            // remove everything after
            if (after) {
                this._param.cancelScheduledValues(after.time);
                this._events.cancel(after.time);
            }
            else {
                this._param.cancelAndHoldAtTime(computedTime);
                this._events.cancel(computedTime + this.sampleTime);
            }
        }
        else if (after) {
            this._param.cancelScheduledValues(after.time);
            // cancel the next event(s)
            this._events.cancel(after.time);
            if (after.type === "linearRampToValueAtTime") {
                this.linearRampToValueAtTime(this._toType(valueAtTime), computedTime);
            }
            else if (after.type === "exponentialRampToValueAtTime") {
                this.exponentialRampToValueAtTime(this._toType(valueAtTime), computedTime);
            }
        }
        // set the value at the given time
        this._events.add({
            time: computedTime,
            type: "setValueAtTime",
            value: valueAtTime,
        });
        this._param.setValueAtTime(valueAtTime, computedTime);
        return this;
    }
    rampTo(value, rampTime = 0.1, startTime) {
        if (this.units === "frequency" || this.units === "bpm" || this.units === "decibels") {
            this.exponentialRampTo(value, rampTime, startTime);
        }
        else {
            this.linearRampTo(value, rampTime, startTime);
        }
        return this;
    }
    /**
     * Apply all of the previously scheduled events to the passed in Param or AudioParam.
     * The applied values will start at the context's current time and schedule
     * all of the events which are scheduled on this Param onto the passed in param.
     */
    apply(param) {
        const now = this.context.currentTime;
        // set the param's value at the current time and schedule everything else
        param.setValueAtTime(this.getValueAtTime(now), now);
        // if the previous event was a curve, then set the rest of it
        const previousEvent = this._events.get(now);
        if (previousEvent && previousEvent.type === "setTargetAtTime") {
            // approx it until the next event with linear ramps
            const nextEvent = this._events.getAfter(previousEvent.time);
            // or for 2 seconds if there is no event
            const endTime = nextEvent ? nextEvent.time : now + 2;
            const subdivisions = (endTime - now) / 10;
            for (let i = now; i < endTime; i += subdivisions) {
                param.linearRampToValueAtTime(this.getValueAtTime(i), i);
            }
        }
        this._events.forEachAfter(this.context.currentTime, event => {
            if (event.type === "cancelScheduledValues") {
                param.cancelScheduledValues(event.time);
            }
            else if (event.type === "setTargetAtTime") {
                param.setTargetAtTime(event.value, event.time, event.constant);
            }
            else {
                param[event.type](event.value, event.time);
            }
        });
        return this;
    }
    /**
     * Replace the Param's internal AudioParam. Will apply scheduled curves
     * onto the parameter and replace the connections.
     */
    setParam(param) {
        assert(this._swappable, "The Param must be assigned as 'swappable' in the constructor");
        const input = this.input;
        input.disconnect(this._param);
        this.apply(param);
        this._param = param;
        input.connect(this._param);
        return this;
    }
    dispose() {
        super.dispose();
        this._events.dispose();
        return this;
    }
    get defaultValue() {
        return this._toType(this._param.defaultValue);
    }
    //-------------------------------------
    // 	AUTOMATION CURVE CALCULATIONS
    // 	MIT License, copyright (c) 2014 Jordan Santell
    //-------------------------------------
    // Calculates the the value along the curve produced by setTargetAtTime
    _exponentialApproach(t0, v0, v1, timeConstant, t) {
        return v1 + (v0 - v1) * Math.exp(-(t - t0) / timeConstant);
    }
    // Calculates the the value along the curve produced by linearRampToValueAtTime
    _linearInterpolate(t0, v0, t1, v1, t) {
        return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
    }
    // Calculates the the value along the curve produced by exponentialRampToValueAtTime
    _exponentialInterpolate(t0, v0, t1, v1, t) {
        return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
    }
}

/**
 * ToneAudioNode is the base class for classes which process audio.
 */
class ToneAudioNode extends ToneWithContext {
    constructor() {
        super(...arguments);
        /**
         * The name of the class
         */
        this.name = "ToneAudioNode";
        /**
         * List all of the node that must be set to match the ChannelProperties
         */
        this._internalChannels = [];
    }
    /**
     * The number of inputs feeding into the AudioNode.
     * For source nodes, this will be 0.
     * @example
     * const node = new Tone.Gain();
     * console.log(node.numberOfInputs);
     */
    get numberOfInputs() {
        if (isDefined(this.input)) {
            if (isAudioParam(this.input) || this.input instanceof Param) {
                return 1;
            }
            else {
                return this.input.numberOfInputs;
            }
        }
        else {
            return 0;
        }
    }
    /**
     * The number of outputs of the AudioNode.
     * @example
     * const node = new Tone.Gain();
     * console.log(node.numberOfOutputs);
     */
    get numberOfOutputs() {
        if (isDefined(this.output)) {
            return this.output.numberOfOutputs;
        }
        else {
            return 0;
        }
    }
    //-------------------------------------
    // AUDIO PROPERTIES
    //-------------------------------------
    /**
     * Used to decide which nodes to get/set properties on
     */
    _isAudioNode(node) {
        return isDefined(node) && (node instanceof ToneAudioNode || isAudioNode$1(node));
    }
    /**
     * Get all of the audio nodes (either internal or input/output) which together
     * make up how the class node responds to channel input/output
     */
    _getInternalNodes() {
        const nodeList = this._internalChannels.slice(0);
        if (this._isAudioNode(this.input)) {
            nodeList.push(this.input);
        }
        if (this._isAudioNode(this.output)) {
            if (this.input !== this.output) {
                nodeList.push(this.output);
            }
        }
        return nodeList;
    }
    /**
     * Set the audio options for this node such as channelInterpretation
     * channelCount, etc.
     * @param options
     */
    _setChannelProperties(options) {
        const nodeList = this._getInternalNodes();
        nodeList.forEach(node => {
            node.channelCount = options.channelCount;
            node.channelCountMode = options.channelCountMode;
            node.channelInterpretation = options.channelInterpretation;
        });
    }
    /**
     * Get the current audio options for this node such as channelInterpretation
     * channelCount, etc.
     */
    _getChannelProperties() {
        const nodeList = this._getInternalNodes();
        assert(nodeList.length > 0, "ToneAudioNode does not have any internal nodes");
        // use the first node to get properties
        // they should all be the same
        const node = nodeList[0];
        return {
            channelCount: node.channelCount,
            channelCountMode: node.channelCountMode,
            channelInterpretation: node.channelInterpretation,
        };
    }
    /**
     * channelCount is the number of channels used when up-mixing and down-mixing
     * connections to any inputs to the node. The default value is 2 except for
     * specific nodes where its value is specially determined.
     */
    get channelCount() {
        return this._getChannelProperties().channelCount;
    }
    set channelCount(channelCount) {
        const props = this._getChannelProperties();
        // merge it with the other properties
        this._setChannelProperties(Object.assign(props, { channelCount }));
    }
    /**
     * channelCountMode determines how channels will be counted when up-mixing and
     * down-mixing connections to any inputs to the node.
     * The default value is "max". This attribute has no effect for nodes with no inputs.
     * * "max" - computedNumberOfChannels is the maximum of the number of channels of all connections to an input. In this mode channelCount is ignored.
     * * "clamped-max" - computedNumberOfChannels is determined as for "max" and then clamped to a maximum value of the given channelCount.
     * * "explicit" - computedNumberOfChannels is the exact value as specified by the channelCount.
     */
    get channelCountMode() {
        return this._getChannelProperties().channelCountMode;
    }
    set channelCountMode(channelCountMode) {
        const props = this._getChannelProperties();
        // merge it with the other properties
        this._setChannelProperties(Object.assign(props, { channelCountMode }));
    }
    /**
     * channelInterpretation determines how individual channels will be treated
     * when up-mixing and down-mixing connections to any inputs to the node.
     * The default value is "speakers".
     */
    get channelInterpretation() {
        return this._getChannelProperties().channelInterpretation;
    }
    set channelInterpretation(channelInterpretation) {
        const props = this._getChannelProperties();
        // merge it with the other properties
        this._setChannelProperties(Object.assign(props, { channelInterpretation }));
    }
    //-------------------------------------
    // CONNECTIONS
    //-------------------------------------
    /**
     * connect the output of a ToneAudioNode to an AudioParam, AudioNode, or ToneAudioNode
     * @param destination The output to connect to
     * @param outputNum The output to connect from
     * @param inputNum The input to connect to
     */
    connect(destination, outputNum = 0, inputNum = 0) {
        connect(this, destination, outputNum, inputNum);
        return this;
    }
    /**
     * Connect the output to the context's destination node.
     * @example
     * const osc = new Tone.Oscillator("C2").start();
     * osc.toDestination();
     */
    toDestination() {
        this.connect(this.context.destination);
        return this;
    }
    /**
     * Connect the output to the context's destination node.
     * See [[toDestination]]
     * @deprecated
     */
    toMaster() {
        warn("toMaster() has been renamed toDestination()");
        return this.toDestination();
    }
    /**
     * disconnect the output
     */
    disconnect(destination, outputNum = 0, inputNum = 0) {
        disconnect(this, destination, outputNum, inputNum);
        return this;
    }
    /**
     * Connect the output of this node to the rest of the nodes in series.
     * @example
     * const player = new Tone.Player("https://tonejs.github.io/audio/drum-samples/handdrum-loop.mp3");
     * player.autostart = true;
     * const filter = new Tone.AutoFilter(4).start();
     * const distortion = new Tone.Distortion(0.5);
     * // connect the player to the filter, distortion and then to the master output
     * player.chain(filter, distortion, Tone.Destination);
     */
    chain(...nodes) {
        connectSeries(this, ...nodes);
        return this;
    }
    /**
     * connect the output of this node to the rest of the nodes in parallel.
     * @example
     * const player = new Tone.Player("https://tonejs.github.io/audio/drum-samples/conga-rhythm.mp3");
     * player.autostart = true;
     * const pitchShift = new Tone.PitchShift(4).toDestination();
     * const filter = new Tone.Filter("G5").toDestination();
     * // connect a node to the pitch shift and filter in parallel
     * player.fan(pitchShift, filter);
     */
    fan(...nodes) {
        nodes.forEach(node => this.connect(node));
        return this;
    }
    /**
     * Dispose and disconnect
     */
    dispose() {
        super.dispose();
        if (isDefined(this.input)) {
            if (this.input instanceof ToneAudioNode) {
                this.input.dispose();
            }
            else if (isAudioNode$1(this.input)) {
                this.input.disconnect();
            }
        }
        if (isDefined(this.output)) {
            if (this.output instanceof ToneAudioNode) {
                this.output.dispose();
            }
            else if (isAudioNode$1(this.output)) {
                this.output.disconnect();
            }
        }
        this._internalChannels = [];
        return this;
    }
}
//-------------------------------------
// CONNECTIONS
//-------------------------------------
/**
 * connect together all of the arguments in series
 * @param nodes
 */
function connectSeries(...nodes) {
    const first = nodes.shift();
    nodes.reduce((prev, current) => {
        if (prev instanceof ToneAudioNode) {
            prev.connect(current);
        }
        else if (isAudioNode$1(prev)) {
            connect(prev, current);
        }
        return current;
    }, first);
}
/**
 * Connect two nodes together so that signal flows from the
 * first node to the second. Optionally specify the input and output channels.
 * @param srcNode The source node
 * @param dstNode The destination node
 * @param outputNumber The output channel of the srcNode
 * @param inputNumber The input channel of the dstNode
 */
function connect(srcNode, dstNode, outputNumber = 0, inputNumber = 0) {
    assert(isDefined(srcNode), "Cannot connect from undefined node");
    assert(isDefined(dstNode), "Cannot connect to undefined node");
    if (dstNode instanceof ToneAudioNode || isAudioNode$1(dstNode)) {
        assert(dstNode.numberOfInputs > 0, "Cannot connect to node with no inputs");
    }
    assert(srcNode.numberOfOutputs > 0, "Cannot connect from node with no outputs");
    // resolve the input of the dstNode
    while ((dstNode instanceof ToneAudioNode || dstNode instanceof Param)) {
        if (isDefined(dstNode.input)) {
            dstNode = dstNode.input;
        }
    }
    while (srcNode instanceof ToneAudioNode) {
        if (isDefined(srcNode.output)) {
            srcNode = srcNode.output;
        }
    }
    // make the connection
    if (isAudioParam(dstNode)) {
        srcNode.connect(dstNode, outputNumber);
    }
    else {
        srcNode.connect(dstNode, outputNumber, inputNumber);
    }
}
/**
 * Disconnect a node from all nodes or optionally include a destination node and input/output channels.
 * @param srcNode The source node
 * @param dstNode The destination node
 * @param outputNumber The output channel of the srcNode
 * @param inputNumber The input channel of the dstNode
 */
function disconnect(srcNode, dstNode, outputNumber = 0, inputNumber = 0) {
    // resolve the destination node
    if (isDefined(dstNode)) {
        while (dstNode instanceof ToneAudioNode) {
            dstNode = dstNode.input;
        }
    }
    // resolve the src node
    while (!(isAudioNode$1(srcNode))) {
        if (isDefined(srcNode.output)) {
            srcNode = srcNode.output;
        }
    }
    if (isAudioParam(dstNode)) {
        srcNode.disconnect(dstNode, outputNumber);
    }
    else if (isAudioNode$1(dstNode)) {
        srcNode.disconnect(dstNode, outputNumber, inputNumber);
    }
    else {
        srcNode.disconnect();
    }
}

/**
 * A thin wrapper around the Native Web Audio GainNode.
 * The GainNode is a basic building block of the Web Audio
 * API and is useful for routing audio and adjusting gains.
 * @category Core
 * @example
 * return Tone.Offline(() => {
 * 	const gainNode = new Tone.Gain(0).toDestination();
 * 	const osc = new Tone.Oscillator(30).connect(gainNode).start();
 * 	gainNode.gain.rampTo(1, 0.1);
 * 	gainNode.gain.rampTo(0, 0.4, 0.2);
 * }, 0.7, 1);
 */
class Gain extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Gain.getDefaults(), arguments, ["gain", "units"]));
        this.name = "Gain";
        /**
         * The wrapped GainNode.
         */
        this._gainNode = this.context.createGain();
        // input = output
        this.input = this._gainNode;
        this.output = this._gainNode;
        const options = optionsFromArguments(Gain.getDefaults(), arguments, ["gain", "units"]);
        this.gain = new Param({
            context: this.context,
            convert: options.convert,
            param: this._gainNode.gain,
            units: options.units,
            value: options.gain,
            minValue: options.minValue,
            maxValue: options.maxValue,
        });
        readOnly(this, "gain");
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            convert: true,
            gain: 1,
            units: "gain",
        });
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._gainNode.disconnect();
        this.gain.dispose();
        return this;
    }
}

/**
 * Base class for fire-and-forget nodes
 */
class OneShotSource extends ToneAudioNode {
    constructor(options) {
        super(options);
        /**
         * The callback to invoke after the
         * source is done playing.
         */
        this.onended = noOp;
        /**
         * The start time
         */
        this._startTime = -1;
        /**
         * The stop time
         */
        this._stopTime = -1;
        /**
         * The id of the timeout
         */
        this._timeout = -1;
        /**
         * The public output node
         */
        this.output = new Gain({
            context: this.context,
            gain: 0,
        });
        /**
         * The output gain node.
         */
        this._gainNode = this.output;
        /**
         * Get the playback state at the given time
         */
        this.getStateAtTime = function (time) {
            const computedTime = this.toSeconds(time);
            if (this._startTime !== -1 &&
                computedTime >= this._startTime &&
                (this._stopTime === -1 || computedTime <= this._stopTime)) {
                return "started";
            }
            else {
                return "stopped";
            }
        };
        this._fadeIn = options.fadeIn;
        this._fadeOut = options.fadeOut;
        this._curve = options.curve;
        this.onended = options.onended;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            curve: "linear",
            fadeIn: 0,
            fadeOut: 0,
            onended: noOp,
        });
    }
    /**
     * Start the source at the given time
     * @param  time When to start the source
     */
    _startGain(time, gain = 1) {
        assert(this._startTime === -1, "Source cannot be started more than once");
        // apply a fade in envelope
        const fadeInTime = this.toSeconds(this._fadeIn);
        // record the start time
        this._startTime = time + fadeInTime;
        this._startTime = Math.max(this._startTime, this.context.currentTime);
        // schedule the envelope
        if (fadeInTime > 0) {
            this._gainNode.gain.setValueAtTime(0, time);
            if (this._curve === "linear") {
                this._gainNode.gain.linearRampToValueAtTime(gain, time + fadeInTime);
            }
            else {
                this._gainNode.gain.exponentialApproachValueAtTime(gain, time, fadeInTime);
            }
        }
        else {
            this._gainNode.gain.setValueAtTime(gain, time);
        }
        return this;
    }
    /**
     * Stop the source node at the given time.
     * @param time When to stop the source
     */
    stop(time) {
        this.log("stop", time);
        this._stopGain(this.toSeconds(time));
        return this;
    }
    /**
     * Stop the source at the given time
     * @param  time When to stop the source
     */
    _stopGain(time) {
        assert(this._startTime !== -1, "'start' must be called before 'stop'");
        // cancel the previous stop
        this.cancelStop();
        // the fadeOut time
        const fadeOutTime = this.toSeconds(this._fadeOut);
        // schedule the stop callback
        this._stopTime = this.toSeconds(time) + fadeOutTime;
        this._stopTime = Math.max(this._stopTime, this.context.currentTime);
        if (fadeOutTime > 0) {
            // start the fade out curve at the given time
            if (this._curve === "linear") {
                this._gainNode.gain.linearRampTo(0, fadeOutTime, time);
            }
            else {
                this._gainNode.gain.targetRampTo(0, fadeOutTime, time);
            }
        }
        else {
            // stop any ongoing ramps, and set the value to 0
            this._gainNode.gain.cancelAndHoldAtTime(time);
            this._gainNode.gain.setValueAtTime(0, time);
        }
        this.context.clearTimeout(this._timeout);
        this._timeout = this.context.setTimeout(() => {
            // allow additional time for the exponential curve to fully decay
            const additionalTail = this._curve === "exponential" ? fadeOutTime * 2 : 0;
            this._stopSource(this.now() + additionalTail);
            this._onended();
        }, this._stopTime - this.context.currentTime);
        return this;
    }
    /**
     * Invoke the onended callback
     */
    _onended() {
        if (this.onended !== noOp) {
            this.onended(this);
            // overwrite onended to make sure it only is called once
            this.onended = noOp;
            // dispose when it's ended to free up for garbage collection only in the online context
            if (!this.context.isOffline) {
                const disposeCallback = () => this.dispose();
                // @ts-ignore
                if (typeof window.requestIdleCallback !== "undefined") {
                    // @ts-ignore
                    window.requestIdleCallback(disposeCallback);
                }
                else {
                    setTimeout(disposeCallback, 1000);
                }
            }
        }
    }
    /**
     * Get the playback state at the current time
     */
    get state() {
        return this.getStateAtTime(this.now());
    }
    /**
     * Cancel a scheduled stop event
     */
    cancelStop() {
        this.log("cancelStop");
        assert(this._startTime !== -1, "Source is not started");
        // cancel the stop envelope
        this._gainNode.gain.cancelScheduledValues(this._startTime + this.sampleTime);
        this.context.clearTimeout(this._timeout);
        this._stopTime = -1;
        return this;
    }
    dispose() {
        super.dispose();
        this._gainNode.disconnect();
        return this;
    }
}

/**
 * Wrapper around the native fire-and-forget ConstantSource.
 * Adds the ability to reschedule the stop method.
 * @category Signal
 */
class ToneConstantSource extends OneShotSource {
    constructor() {
        super(optionsFromArguments(ToneConstantSource.getDefaults(), arguments, ["offset"]));
        this.name = "ToneConstantSource";
        /**
         * The signal generator
         */
        this._source = this.context.createConstantSource();
        const options = optionsFromArguments(ToneConstantSource.getDefaults(), arguments, ["offset"]);
        connect(this._source, this._gainNode);
        this.offset = new Param({
            context: this.context,
            convert: options.convert,
            param: this._source.offset,
            units: options.units,
            value: options.offset,
            minValue: options.minValue,
            maxValue: options.maxValue,
        });
    }
    static getDefaults() {
        return Object.assign(OneShotSource.getDefaults(), {
            convert: true,
            offset: 1,
            units: "number",
        });
    }
    /**
     * Start the source node at the given time
     * @param  time When to start the source
     */
    start(time) {
        const computedTime = this.toSeconds(time);
        this.log("start", computedTime);
        this._startGain(computedTime);
        this._source.start(computedTime);
        return this;
    }
    _stopSource(time) {
        this._source.stop(time);
    }
    dispose() {
        super.dispose();
        if (this.state === "started") {
            this.stop();
        }
        this._source.disconnect();
        this.offset.dispose();
        return this;
    }
}

/**
 * A signal is an audio-rate value. Tone.Signal is a core component of the library.
 * Unlike a number, Signals can be scheduled with sample-level accuracy. Tone.Signal
 * has all of the methods available to native Web Audio
 * [AudioParam](http://webaudio.github.io/web-audio-api/#the-audioparam-interface)
 * as well as additional conveniences. Read more about working with signals
 * [here](https://github.com/Tonejs/Tone.js/wiki/Signals).
 *
 * @example
 * const osc = new Tone.Oscillator().toDestination().start();
 * // a scheduleable signal which can be connected to control an AudioParam or another Signal
 * const signal = new Tone.Signal({
 * 	value: "C4",
 * 	units: "frequency"
 * }).connect(osc.frequency);
 * // the scheduled ramp controls the connected signal
 * signal.rampTo("C2", 4, "+0.5");
 * @category Signal
 */
class Signal extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Signal.getDefaults(), arguments, ["value", "units"]));
        this.name = "Signal";
        /**
         * Indicates if the value should be overridden on connection.
         */
        this.override = true;
        const options = optionsFromArguments(Signal.getDefaults(), arguments, ["value", "units"]);
        this.output = this._constantSource = new ToneConstantSource({
            context: this.context,
            convert: options.convert,
            offset: options.value,
            units: options.units,
            minValue: options.minValue,
            maxValue: options.maxValue,
        });
        this._constantSource.start(0);
        this.input = this._param = this._constantSource.offset;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            convert: true,
            units: "number",
            value: 0,
        });
    }
    connect(destination, outputNum = 0, inputNum = 0) {
        // start it only when connected to something
        connectSignal(this, destination, outputNum, inputNum);
        return this;
    }
    dispose() {
        super.dispose();
        this._param.dispose();
        this._constantSource.dispose();
        return this;
    }
    //-------------------------------------
    // ABSTRACT PARAM INTERFACE
    // just a proxy for the ConstantSourceNode's offset AudioParam
    // all docs are generated from AbstractParam.ts
    //-------------------------------------
    setValueAtTime(value, time) {
        this._param.setValueAtTime(value, time);
        return this;
    }
    getValueAtTime(time) {
        return this._param.getValueAtTime(time);
    }
    setRampPoint(time) {
        this._param.setRampPoint(time);
        return this;
    }
    linearRampToValueAtTime(value, time) {
        this._param.linearRampToValueAtTime(value, time);
        return this;
    }
    exponentialRampToValueAtTime(value, time) {
        this._param.exponentialRampToValueAtTime(value, time);
        return this;
    }
    exponentialRampTo(value, rampTime, startTime) {
        this._param.exponentialRampTo(value, rampTime, startTime);
        return this;
    }
    linearRampTo(value, rampTime, startTime) {
        this._param.linearRampTo(value, rampTime, startTime);
        return this;
    }
    targetRampTo(value, rampTime, startTime) {
        this._param.targetRampTo(value, rampTime, startTime);
        return this;
    }
    exponentialApproachValueAtTime(value, time, rampTime) {
        this._param.exponentialApproachValueAtTime(value, time, rampTime);
        return this;
    }
    setTargetAtTime(value, startTime, timeConstant) {
        this._param.setTargetAtTime(value, startTime, timeConstant);
        return this;
    }
    setValueCurveAtTime(values, startTime, duration, scaling) {
        this._param.setValueCurveAtTime(values, startTime, duration, scaling);
        return this;
    }
    cancelScheduledValues(time) {
        this._param.cancelScheduledValues(time);
        return this;
    }
    cancelAndHoldAtTime(time) {
        this._param.cancelAndHoldAtTime(time);
        return this;
    }
    rampTo(value, rampTime, startTime) {
        this._param.rampTo(value, rampTime, startTime);
        return this;
    }
    get value() {
        return this._param.value;
    }
    set value(value) {
        this._param.value = value;
    }
    get convert() {
        return this._param.convert;
    }
    set convert(convert) {
        this._param.convert = convert;
    }
    get units() {
        return this._param.units;
    }
    get overridden() {
        return this._param.overridden;
    }
    set overridden(overridden) {
        this._param.overridden = overridden;
    }
    get maxValue() {
        return this._param.maxValue;
    }
    get minValue() {
        return this._param.minValue;
    }
    /**
     * See [[Param.apply]].
     */
    apply(param) {
        this._param.apply(param);
        return this;
    }
}
/**
 * When connecting from a signal, it's necessary to zero out the node destination
 * node if that node is also a signal. If the destination is not 0, then the values
 * will be summed. This method insures that the output of the destination signal will
 * be the same as the source signal, making the destination signal a pass through node.
 * @param signal The output signal to connect from
 * @param destination the destination to connect to
 * @param outputNum the optional output number
 * @param inputNum the input number
 */
function connectSignal(signal, destination, outputNum, inputNum) {
    if (destination instanceof Param || isAudioParam(destination) ||
        (destination instanceof Signal && destination.override)) {
        // cancel changes
        destination.cancelScheduledValues(0);
        // reset the value
        destination.setValueAtTime(0, 0);
        // mark the value as overridden
        if (destination instanceof Signal) {
            destination.overridden = true;
        }
    }
    connect(signal, destination, outputNum, inputNum);
}

/**
 * A Param class just for computing ticks. Similar to the [[Param]] class,
 * but offers conversion to BPM values as well as ability to compute tick
 * duration and elapsed ticks
 */
class TickParam extends Param {
    constructor() {
        super(optionsFromArguments(TickParam.getDefaults(), arguments, ["value"]));
        this.name = "TickParam";
        /**
         * The timeline which tracks all of the automations.
         */
        this._events = new Timeline(Infinity);
        /**
         * The internal holder for the multiplier value
         */
        this._multiplier = 1;
        const options = optionsFromArguments(TickParam.getDefaults(), arguments, ["value"]);
        // set the multiplier
        this._multiplier = options.multiplier;
        // clear the ticks from the beginning
        this._events.cancel(0);
        // set an initial event
        this._events.add({
            ticks: 0,
            time: 0,
            type: "setValueAtTime",
            value: this._fromType(options.value),
        });
        this.setValueAtTime(options.value, 0);
    }
    static getDefaults() {
        return Object.assign(Param.getDefaults(), {
            multiplier: 1,
            units: "hertz",
            value: 1,
        });
    }
    setTargetAtTime(value, time, constant) {
        // approximate it with multiple linear ramps
        time = this.toSeconds(time);
        this.setRampPoint(time);
        const computedValue = this._fromType(value);
        // start from previously scheduled value
        const prevEvent = this._events.get(time);
        const segments = Math.round(Math.max(1 / constant, 1));
        for (let i = 0; i <= segments; i++) {
            const segTime = constant * i + time;
            const rampVal = this._exponentialApproach(prevEvent.time, prevEvent.value, computedValue, constant, segTime);
            this.linearRampToValueAtTime(this._toType(rampVal), segTime);
        }
        return this;
    }
    setValueAtTime(value, time) {
        const computedTime = this.toSeconds(time);
        super.setValueAtTime(value, time);
        const event = this._events.get(computedTime);
        const previousEvent = this._events.previousEvent(event);
        const ticksUntilTime = this._getTicksUntilEvent(previousEvent, computedTime);
        event.ticks = Math.max(ticksUntilTime, 0);
        return this;
    }
    linearRampToValueAtTime(value, time) {
        const computedTime = this.toSeconds(time);
        super.linearRampToValueAtTime(value, time);
        const event = this._events.get(computedTime);
        const previousEvent = this._events.previousEvent(event);
        const ticksUntilTime = this._getTicksUntilEvent(previousEvent, computedTime);
        event.ticks = Math.max(ticksUntilTime, 0);
        return this;
    }
    exponentialRampToValueAtTime(value, time) {
        // aproximate it with multiple linear ramps
        time = this.toSeconds(time);
        const computedVal = this._fromType(value);
        // start from previously scheduled value
        const prevEvent = this._events.get(time);
        // approx 10 segments per second
        const segments = Math.round(Math.max((time - prevEvent.time) * 10, 1));
        const segmentDur = ((time - prevEvent.time) / segments);
        for (let i = 0; i <= segments; i++) {
            const segTime = segmentDur * i + prevEvent.time;
            const rampVal = this._exponentialInterpolate(prevEvent.time, prevEvent.value, time, computedVal, segTime);
            this.linearRampToValueAtTime(this._toType(rampVal), segTime);
        }
        return this;
    }
    /**
     * Returns the tick value at the time. Takes into account
     * any automation curves scheduled on the signal.
     * @param  event The time to get the tick count at
     * @return The number of ticks which have elapsed at the time given any automations.
     */
    _getTicksUntilEvent(event, time) {
        if (event === null) {
            event = {
                ticks: 0,
                time: 0,
                type: "setValueAtTime",
                value: 0,
            };
        }
        else if (isUndef(event.ticks)) {
            const previousEvent = this._events.previousEvent(event);
            event.ticks = this._getTicksUntilEvent(previousEvent, event.time);
        }
        const val0 = this._fromType(this.getValueAtTime(event.time));
        let val1 = this._fromType(this.getValueAtTime(time));
        // if it's right on the line, take the previous value
        const onTheLineEvent = this._events.get(time);
        if (onTheLineEvent && onTheLineEvent.time === time && onTheLineEvent.type === "setValueAtTime") {
            val1 = this._fromType(this.getValueAtTime(time - this.sampleTime));
        }
        return 0.5 * (time - event.time) * (val0 + val1) + event.ticks;
    }
    /**
     * Returns the tick value at the time. Takes into account
     * any automation curves scheduled on the signal.
     * @param  time The time to get the tick count at
     * @return The number of ticks which have elapsed at the time given any automations.
     */
    getTicksAtTime(time) {
        const computedTime = this.toSeconds(time);
        const event = this._events.get(computedTime);
        return Math.max(this._getTicksUntilEvent(event, computedTime), 0);
    }
    /**
     * Return the elapsed time of the number of ticks from the given time
     * @param ticks The number of ticks to calculate
     * @param  time The time to get the next tick from
     * @return The duration of the number of ticks from the given time in seconds
     */
    getDurationOfTicks(ticks, time) {
        const computedTime = this.toSeconds(time);
        const currentTick = this.getTicksAtTime(time);
        return this.getTimeOfTick(currentTick + ticks) - computedTime;
    }
    /**
     * Given a tick, returns the time that tick occurs at.
     * @return The time that the tick occurs.
     */
    getTimeOfTick(tick) {
        const before = this._events.get(tick, "ticks");
        const after = this._events.getAfter(tick, "ticks");
        if (before && before.ticks === tick) {
            return before.time;
        }
        else if (before && after &&
            after.type === "linearRampToValueAtTime" &&
            before.value !== after.value) {
            const val0 = this._fromType(this.getValueAtTime(before.time));
            const val1 = this._fromType(this.getValueAtTime(after.time));
            const delta = (val1 - val0) / (after.time - before.time);
            const k = Math.sqrt(Math.pow(val0, 2) - 2 * delta * (before.ticks - tick));
            const sol1 = (-val0 + k) / delta;
            const sol2 = (-val0 - k) / delta;
            return (sol1 > 0 ? sol1 : sol2) + before.time;
        }
        else if (before) {
            if (before.value === 0) {
                return Infinity;
            }
            else {
                return before.time + (tick - before.ticks) / before.value;
            }
        }
        else {
            return tick / this._initialValue;
        }
    }
    /**
     * Convert some number of ticks their the duration in seconds accounting
     * for any automation curves starting at the given time.
     * @param  ticks The number of ticks to convert to seconds.
     * @param  when  When along the automation timeline to convert the ticks.
     * @return The duration in seconds of the ticks.
     */
    ticksToTime(ticks, when) {
        return this.getDurationOfTicks(ticks, when);
    }
    /**
     * The inverse of [[ticksToTime]]. Convert a duration in
     * seconds to the corresponding number of ticks accounting for any
     * automation curves starting at the given time.
     * @param  duration The time interval to convert to ticks.
     * @param  when When along the automation timeline to convert the ticks.
     * @return The duration in ticks.
     */
    timeToTicks(duration, when) {
        const computedTime = this.toSeconds(when);
        const computedDuration = this.toSeconds(duration);
        const startTicks = this.getTicksAtTime(computedTime);
        const endTicks = this.getTicksAtTime(computedTime + computedDuration);
        return endTicks - startTicks;
    }
    /**
     * Convert from the type when the unit value is BPM
     */
    _fromType(val) {
        if (this.units === "bpm" && this.multiplier) {
            return 1 / (60 / val / this.multiplier);
        }
        else {
            return super._fromType(val);
        }
    }
    /**
     * Special case of type conversion where the units === "bpm"
     */
    _toType(val) {
        if (this.units === "bpm" && this.multiplier) {
            return (val / this.multiplier) * 60;
        }
        else {
            return super._toType(val);
        }
    }
    /**
     * A multiplier on the bpm value. Useful for setting a PPQ relative to the base frequency value.
     */
    get multiplier() {
        return this._multiplier;
    }
    set multiplier(m) {
        // get and reset the current value with the new multiplier
        // might be necessary to clear all the previous values
        const currentVal = this.value;
        this._multiplier = m;
        this.cancelScheduledValues(0);
        this.setValueAtTime(currentVal, 0);
    }
}

/**
 * TickSignal extends Tone.Signal, but adds the capability
 * to calculate the number of elapsed ticks. exponential and target curves
 * are approximated with multiple linear ramps.
 *
 * Thank you Bruno Dias, H. Sofia Pinto, and David M. Matos,
 * for your [WAC paper](https://smartech.gatech.edu/bitstream/handle/1853/54588/WAC2016-49.pdf)
 * describing integrating timing functions for tempo calculations.
 */
class TickSignal extends Signal {
    constructor() {
        super(optionsFromArguments(TickSignal.getDefaults(), arguments, ["value"]));
        this.name = "TickSignal";
        const options = optionsFromArguments(TickSignal.getDefaults(), arguments, ["value"]);
        this.input = this._param = new TickParam({
            context: this.context,
            convert: options.convert,
            multiplier: options.multiplier,
            param: this._constantSource.offset,
            units: options.units,
            value: options.value,
        });
    }
    static getDefaults() {
        return Object.assign(Signal.getDefaults(), {
            multiplier: 1,
            units: "hertz",
            value: 1,
        });
    }
    ticksToTime(ticks, when) {
        return this._param.ticksToTime(ticks, when);
    }
    timeToTicks(duration, when) {
        return this._param.timeToTicks(duration, when);
    }
    getTimeOfTick(tick) {
        return this._param.getTimeOfTick(tick);
    }
    getDurationOfTicks(ticks, time) {
        return this._param.getDurationOfTicks(ticks, time);
    }
    getTicksAtTime(time) {
        return this._param.getTicksAtTime(time);
    }
    /**
     * A multiplier on the bpm value. Useful for setting a PPQ relative to the base frequency value.
     */
    get multiplier() {
        return this._param.multiplier;
    }
    set multiplier(m) {
        this._param.multiplier = m;
    }
    dispose() {
        super.dispose();
        this._param.dispose();
        return this;
    }
}

/**
 * Uses [TickSignal](TickSignal) to track elapsed ticks with complex automation curves.
 */
class TickSource extends ToneWithContext {
    constructor() {
        super(optionsFromArguments(TickSource.getDefaults(), arguments, ["frequency"]));
        this.name = "TickSource";
        /**
         * The state timeline
         */
        this._state = new StateTimeline();
        /**
         * The offset values of the ticks
         */
        this._tickOffset = new Timeline();
        const options = optionsFromArguments(TickSource.getDefaults(), arguments, ["frequency"]);
        this.frequency = new TickSignal({
            context: this.context,
            units: options.units,
            value: options.frequency,
        });
        readOnly(this, "frequency");
        // set the initial state
        this._state.setStateAtTime("stopped", 0);
        // add the first event
        this.setTicksAtTime(0, 0);
    }
    static getDefaults() {
        return Object.assign({
            frequency: 1,
            units: "hertz",
        }, ToneWithContext.getDefaults());
    }
    /**
     * Returns the playback state of the source, either "started", "stopped" or "paused".
     */
    get state() {
        return this.getStateAtTime(this.now());
    }
    /**
     * Start the clock at the given time. Optionally pass in an offset
     * of where to start the tick counter from.
     * @param  time    The time the clock should start
     * @param offset The number of ticks to start the source at
     */
    start(time, offset) {
        const computedTime = this.toSeconds(time);
        if (this._state.getValueAtTime(computedTime) !== "started") {
            this._state.setStateAtTime("started", computedTime);
            if (isDefined(offset)) {
                this.setTicksAtTime(offset, computedTime);
            }
        }
        return this;
    }
    /**
     * Stop the clock. Stopping the clock resets the tick counter to 0.
     * @param time The time when the clock should stop.
     */
    stop(time) {
        const computedTime = this.toSeconds(time);
        // cancel the previous stop
        if (this._state.getValueAtTime(computedTime) === "stopped") {
            const event = this._state.get(computedTime);
            if (event && event.time > 0) {
                this._tickOffset.cancel(event.time);
                this._state.cancel(event.time);
            }
        }
        this._state.cancel(computedTime);
        this._state.setStateAtTime("stopped", computedTime);
        this.setTicksAtTime(0, computedTime);
        return this;
    }
    /**
     * Pause the clock. Pausing does not reset the tick counter.
     * @param time The time when the clock should stop.
     */
    pause(time) {
        const computedTime = this.toSeconds(time);
        if (this._state.getValueAtTime(computedTime) === "started") {
            this._state.setStateAtTime("paused", computedTime);
        }
        return this;
    }
    /**
     * Cancel start/stop/pause and setTickAtTime events scheduled after the given time.
     * @param time When to clear the events after
     */
    cancel(time) {
        time = this.toSeconds(time);
        this._state.cancel(time);
        this._tickOffset.cancel(time);
        return this;
    }
    /**
     * Get the elapsed ticks at the given time
     * @param  time  When to get the tick value
     * @return The number of ticks
     */
    getTicksAtTime(time) {
        const computedTime = this.toSeconds(time);
        const stopEvent = this._state.getLastState("stopped", computedTime);
        // this event allows forEachBetween to iterate until the current time
        const tmpEvent = { state: "paused", time: computedTime };
        this._state.add(tmpEvent);
        // keep track of the previous offset event
        let lastState = stopEvent;
        let elapsedTicks = 0;
        // iterate through all the events since the last stop
        this._state.forEachBetween(stopEvent.time, computedTime + this.sampleTime, e => {
            let periodStartTime = lastState.time;
            // if there is an offset event in this period use that
            const offsetEvent = this._tickOffset.get(e.time);
            if (offsetEvent && offsetEvent.time >= lastState.time) {
                elapsedTicks = offsetEvent.ticks;
                periodStartTime = offsetEvent.time;
            }
            if (lastState.state === "started" && e.state !== "started") {
                elapsedTicks += this.frequency.getTicksAtTime(e.time) - this.frequency.getTicksAtTime(periodStartTime);
            }
            lastState = e;
        });
        // remove the temporary event
        this._state.remove(tmpEvent);
        // return the ticks
        return elapsedTicks;
    }
    /**
     * The number of times the callback was invoked. Starts counting at 0
     * and increments after the callback was invoked. Returns -1 when stopped.
     */
    get ticks() {
        return this.getTicksAtTime(this.now());
    }
    set ticks(t) {
        this.setTicksAtTime(t, this.now());
    }
    /**
     * The time since ticks=0 that the TickSource has been running. Accounts
     * for tempo curves
     */
    get seconds() {
        return this.getSecondsAtTime(this.now());
    }
    set seconds(s) {
        const now = this.now();
        const ticks = this.frequency.timeToTicks(s, now);
        this.setTicksAtTime(ticks, now);
    }
    /**
     * Return the elapsed seconds at the given time.
     * @param  time  When to get the elapsed seconds
     * @return  The number of elapsed seconds
     */
    getSecondsAtTime(time) {
        time = this.toSeconds(time);
        const stopEvent = this._state.getLastState("stopped", time);
        // this event allows forEachBetween to iterate until the current time
        const tmpEvent = { state: "paused", time };
        this._state.add(tmpEvent);
        // keep track of the previous offset event
        let lastState = stopEvent;
        let elapsedSeconds = 0;
        // iterate through all the events since the last stop
        this._state.forEachBetween(stopEvent.time, time + this.sampleTime, e => {
            let periodStartTime = lastState.time;
            // if there is an offset event in this period use that
            const offsetEvent = this._tickOffset.get(e.time);
            if (offsetEvent && offsetEvent.time >= lastState.time) {
                elapsedSeconds = offsetEvent.seconds;
                periodStartTime = offsetEvent.time;
            }
            if (lastState.state === "started" && e.state !== "started") {
                elapsedSeconds += e.time - periodStartTime;
            }
            lastState = e;
        });
        // remove the temporary event
        this._state.remove(tmpEvent);
        // return the ticks
        return elapsedSeconds;
    }
    /**
     * Set the clock's ticks at the given time.
     * @param  ticks The tick value to set
     * @param  time  When to set the tick value
     */
    setTicksAtTime(ticks, time) {
        time = this.toSeconds(time);
        this._tickOffset.cancel(time);
        this._tickOffset.add({
            seconds: this.frequency.getDurationOfTicks(ticks, time),
            ticks,
            time,
        });
        return this;
    }
    /**
     * Returns the scheduled state at the given time.
     * @param  time  The time to query.
     */
    getStateAtTime(time) {
        time = this.toSeconds(time);
        return this._state.getValueAtTime(time);
    }
    /**
     * Get the time of the given tick. The second argument
     * is when to test before. Since ticks can be set (with setTicksAtTime)
     * there may be multiple times for a given tick value.
     * @param  tick The tick number.
     * @param  before When to measure the tick value from.
     * @return The time of the tick
     */
    getTimeOfTick(tick, before = this.now()) {
        const offset = this._tickOffset.get(before);
        const event = this._state.get(before);
        const startTime = Math.max(offset.time, event.time);
        const absoluteTicks = this.frequency.getTicksAtTime(startTime) + tick - offset.ticks;
        return this.frequency.getTimeOfTick(absoluteTicks);
    }
    /**
     * Invoke the callback event at all scheduled ticks between the
     * start time and the end time
     * @param  startTime  The beginning of the search range
     * @param  endTime    The end of the search range
     * @param  callback   The callback to invoke with each tick
     */
    forEachTickBetween(startTime, endTime, callback) {
        // only iterate through the sections where it is "started"
        let lastStateEvent = this._state.get(startTime);
        this._state.forEachBetween(startTime, endTime, event => {
            if (lastStateEvent && lastStateEvent.state === "started" && event.state !== "started") {
                this.forEachTickBetween(Math.max(lastStateEvent.time, startTime), event.time - this.sampleTime, callback);
            }
            lastStateEvent = event;
        });
        let error = null;
        if (lastStateEvent && lastStateEvent.state === "started") {
            const maxStartTime = Math.max(lastStateEvent.time, startTime);
            // figure out the difference between the frequency ticks and the
            const startTicks = this.frequency.getTicksAtTime(maxStartTime);
            const ticksAtStart = this.frequency.getTicksAtTime(lastStateEvent.time);
            const diff = startTicks - ticksAtStart;
            let offset = Math.ceil(diff) - diff;
            // guard against floating point issues
            offset = EQ(offset, 1) ? 0 : offset;
            let nextTickTime = this.frequency.getTimeOfTick(startTicks + offset);
            while (nextTickTime < endTime) {
                try {
                    callback(nextTickTime, Math.round(this.getTicksAtTime(nextTickTime)));
                }
                catch (e) {
                    error = e;
                    break;
                }
                nextTickTime += this.frequency.getDurationOfTicks(1, nextTickTime);
            }
        }
        if (error) {
            throw error;
        }
        return this;
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this._state.dispose();
        this._tickOffset.dispose();
        this.frequency.dispose();
        return this;
    }
}

/**
 * A sample accurate clock which provides a callback at the given rate.
 * While the callback is not sample-accurate (it is still susceptible to
 * loose JS timing), the time passed in as the argument to the callback
 * is precise. For most applications, it is better to use Tone.Transport
 * instead of the Clock by itself since you can synchronize multiple callbacks.
 * @example
 * // the callback will be invoked approximately once a second
 * // and will print the time exactly once a second apart.
 * const clock = new Tone.Clock(time => {
 * 	console.log(time);
 * }, 1);
 * clock.start();
 * @category Core
 */
class Clock extends ToneWithContext {
    constructor() {
        super(optionsFromArguments(Clock.getDefaults(), arguments, ["callback", "frequency"]));
        this.name = "Clock";
        /**
         * The callback function to invoke at the scheduled tick.
         */
        this.callback = noOp;
        /**
         * The last time the loop callback was invoked
         */
        this._lastUpdate = 0;
        /**
         * Keep track of the playback state
         */
        this._state = new StateTimeline("stopped");
        /**
         * Context bound reference to the _loop method
         * This is necessary to remove the event in the end.
         */
        this._boundLoop = this._loop.bind(this);
        const options = optionsFromArguments(Clock.getDefaults(), arguments, ["callback", "frequency"]);
        this.callback = options.callback;
        this._tickSource = new TickSource({
            context: this.context,
            frequency: options.frequency,
            units: options.units,
        });
        this._lastUpdate = 0;
        this.frequency = this._tickSource.frequency;
        readOnly(this, "frequency");
        // add an initial state
        this._state.setStateAtTime("stopped", 0);
        // bind a callback to the worker thread
        this.context.on("tick", this._boundLoop);
    }
    static getDefaults() {
        return Object.assign(ToneWithContext.getDefaults(), {
            callback: noOp,
            frequency: 1,
            units: "hertz",
        });
    }
    /**
     * Returns the playback state of the source, either "started", "stopped" or "paused".
     */
    get state() {
        return this._state.getValueAtTime(this.now());
    }
    /**
     * Start the clock at the given time. Optionally pass in an offset
     * of where to start the tick counter from.
     * @param  time    The time the clock should start
     * @param offset  Where the tick counter starts counting from.
     */
    start(time, offset) {
        // make sure the context is running
        assertContextRunning(this.context);
        // start the loop
        const computedTime = this.toSeconds(time);
        this.log("start", computedTime);
        if (this._state.getValueAtTime(computedTime) !== "started") {
            this._state.setStateAtTime("started", computedTime);
            this._tickSource.start(computedTime, offset);
            if (computedTime < this._lastUpdate) {
                this.emit("start", computedTime, offset);
            }
        }
        return this;
    }
    /**
     * Stop the clock. Stopping the clock resets the tick counter to 0.
     * @param time The time when the clock should stop.
     * @example
     * const clock = new Tone.Clock(time => {
     * 	console.log(time);
     * }, 1);
     * clock.start();
     * // stop the clock after 10 seconds
     * clock.stop("+10");
     */
    stop(time) {
        const computedTime = this.toSeconds(time);
        this.log("stop", computedTime);
        this._state.cancel(computedTime);
        this._state.setStateAtTime("stopped", computedTime);
        this._tickSource.stop(computedTime);
        if (computedTime < this._lastUpdate) {
            this.emit("stop", computedTime);
        }
        return this;
    }
    /**
     * Pause the clock. Pausing does not reset the tick counter.
     * @param time The time when the clock should stop.
     */
    pause(time) {
        const computedTime = this.toSeconds(time);
        if (this._state.getValueAtTime(computedTime) === "started") {
            this._state.setStateAtTime("paused", computedTime);
            this._tickSource.pause(computedTime);
            if (computedTime < this._lastUpdate) {
                this.emit("pause", computedTime);
            }
        }
        return this;
    }
    /**
     * The number of times the callback was invoked. Starts counting at 0
     * and increments after the callback was invoked.
     */
    get ticks() {
        return Math.ceil(this.getTicksAtTime(this.now()));
    }
    set ticks(t) {
        this._tickSource.ticks = t;
    }
    /**
     * The time since ticks=0 that the Clock has been running. Accounts for tempo curves
     */
    get seconds() {
        return this._tickSource.seconds;
    }
    set seconds(s) {
        this._tickSource.seconds = s;
    }
    /**
     * Return the elapsed seconds at the given time.
     * @param  time  When to get the elapsed seconds
     * @return  The number of elapsed seconds
     */
    getSecondsAtTime(time) {
        return this._tickSource.getSecondsAtTime(time);
    }
    /**
     * Set the clock's ticks at the given time.
     * @param  ticks The tick value to set
     * @param  time  When to set the tick value
     */
    setTicksAtTime(ticks, time) {
        this._tickSource.setTicksAtTime(ticks, time);
        return this;
    }
    /**
     * Get the time of the given tick. The second argument
     * is when to test before. Since ticks can be set (with setTicksAtTime)
     * there may be multiple times for a given tick value.
     * @param  tick The tick number.
     * @param  before When to measure the tick value from.
     * @return The time of the tick
     */
    getTimeOfTick(tick, before = this.now()) {
        return this._tickSource.getTimeOfTick(tick, before);
    }
    /**
     * Get the clock's ticks at the given time.
     * @param  time  When to get the tick value
     * @return The tick value at the given time.
     */
    getTicksAtTime(time) {
        return this._tickSource.getTicksAtTime(time);
    }
    /**
     * Get the time of the next tick
     * @param  offset The tick number.
     */
    nextTickTime(offset, when) {
        const computedTime = this.toSeconds(when);
        const currentTick = this.getTicksAtTime(computedTime);
        return this._tickSource.getTimeOfTick(currentTick + offset, computedTime);
    }
    /**
     * The scheduling loop.
     */
    _loop() {
        const startTime = this._lastUpdate;
        const endTime = this.now();
        this._lastUpdate = endTime;
        this.log("loop", startTime, endTime);
        if (startTime !== endTime) {
            // the state change events
            this._state.forEachBetween(startTime, endTime, e => {
                switch (e.state) {
                    case "started":
                        const offset = this._tickSource.getTicksAtTime(e.time);
                        this.emit("start", e.time, offset);
                        break;
                    case "stopped":
                        if (e.time !== 0) {
                            this.emit("stop", e.time);
                        }
                        break;
                    case "paused":
                        this.emit("pause", e.time);
                        break;
                }
            });
            // the tick callbacks
            this._tickSource.forEachTickBetween(startTime, endTime, (time, ticks) => {
                this.callback(time, ticks);
            });
        }
    }
    /**
     * Returns the scheduled state at the given time.
     * @param  time  The time to query.
     * @return  The name of the state input in setStateAtTime.
     * @example
     * const clock = new Tone.Clock();
     * clock.start("+0.1");
     * clock.getStateAtTime("+0.1"); // returns "started"
     */
    getStateAtTime(time) {
        const computedTime = this.toSeconds(time);
        return this._state.getValueAtTime(computedTime);
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this.context.off("tick", this._boundLoop);
        this._tickSource.dispose();
        this._state.dispose();
        return this;
    }
}
Emitter.mixin(Clock);

/**
 * A data structure for holding multiple buffers in a Map-like datastructure.
 *
 * @example
 * const pianoSamples = new Tone.ToneAudioBuffers({
 * 	A1: "https://tonejs.github.io/audio/casio/A1.mp3",
 * 	A2: "https://tonejs.github.io/audio/casio/A2.mp3",
 * }, () => {
 * 	const player = new Tone.Player().toDestination();
 * 	// play one of the samples when they all load
 * 	player.buffer = pianoSamples.get("A2");
 * 	player.start();
 * });
 * @example
 * // To pass in additional parameters in the second parameter
 * const buffers = new Tone.ToneAudioBuffers({
 * 	 urls: {
 * 		 A1: "A1.mp3",
 * 		 A2: "A2.mp3",
 * 	 },
 * 	 onload: () => console.log("loaded"),
 * 	 baseUrl: "https://tonejs.github.io/audio/casio/"
 * });
 * @category Core
 */
class ToneAudioBuffers extends Tone {
    constructor() {
        super();
        this.name = "ToneAudioBuffers";
        /**
         * All of the buffers
         */
        this._buffers = new Map();
        /**
         * Keep track of the number of loaded buffers
         */
        this._loadingCount = 0;
        const options = optionsFromArguments(ToneAudioBuffers.getDefaults(), arguments, ["urls", "onload", "baseUrl"], "urls");
        this.baseUrl = options.baseUrl;
        // add each one
        Object.keys(options.urls).forEach(name => {
            this._loadingCount++;
            const url = options.urls[name];
            this.add(name, url, this._bufferLoaded.bind(this, options.onload), options.onerror);
        });
    }
    static getDefaults() {
        return {
            baseUrl: "",
            onerror: noOp,
            onload: noOp,
            urls: {},
        };
    }
    /**
     * True if the buffers object has a buffer by that name.
     * @param  name  The key or index of the buffer.
     */
    has(name) {
        return this._buffers.has(name.toString());
    }
    /**
     * Get a buffer by name. If an array was loaded,
     * then use the array index.
     * @param  name  The key or index of the buffer.
     */
    get(name) {
        assert(this.has(name), `ToneAudioBuffers has no buffer named: ${name}`);
        return this._buffers.get(name.toString());
    }
    /**
     * A buffer was loaded. decrement the counter.
     */
    _bufferLoaded(callback) {
        this._loadingCount--;
        if (this._loadingCount === 0 && callback) {
            callback();
        }
    }
    /**
     * If the buffers are loaded or not
     */
    get loaded() {
        return Array.from(this._buffers).every(([_, buffer]) => buffer.loaded);
    }
    /**
     * Add a buffer by name and url to the Buffers
     * @param  name      A unique name to give the buffer
     * @param  url  Either the url of the bufer, or a buffer which will be added with the given name.
     * @param  callback  The callback to invoke when the url is loaded.
     * @param  onerror  Invoked if the buffer can't be loaded
     */
    add(name, url, callback = noOp, onerror = noOp) {
        if (isString(url)) {
            this._buffers.set(name.toString(), new ToneAudioBuffer(this.baseUrl + url, callback, onerror));
        }
        else {
            this._buffers.set(name.toString(), new ToneAudioBuffer(url, callback, onerror));
        }
        return this;
    }
    dispose() {
        super.dispose();
        this._buffers.forEach(buffer => buffer.dispose());
        this._buffers.clear();
        return this;
    }
}

/**
 * Midi is a primitive type for encoding Time values.
 * Midi can be constructed with or without the `new` keyword. Midi can be passed
 * into the parameter of any method which takes time as an argument.
 * @category Unit
 */
class MidiClass extends FrequencyClass {
    constructor() {
        super(...arguments);
        this.name = "MidiClass";
        this.defaultUnits = "midi";
    }
    /**
     * Returns the value of a frequency in the current units
     */
    _frequencyToUnits(freq) {
        return ftom(super._frequencyToUnits(freq));
    }
    /**
     * Returns the value of a tick in the current time units
     */
    _ticksToUnits(ticks) {
        return ftom(super._ticksToUnits(ticks));
    }
    /**
     * Return the value of the beats in the current units
     */
    _beatsToUnits(beats) {
        return ftom(super._beatsToUnits(beats));
    }
    /**
     * Returns the value of a second in the current units
     */
    _secondsToUnits(seconds) {
        return ftom(super._secondsToUnits(seconds));
    }
    /**
     * Return the value of the frequency as a MIDI note
     * @example
     * Tone.Midi(60).toMidi(); // 60
     */
    toMidi() {
        return this.valueOf();
    }
    /**
     * Return the value of the frequency as a MIDI note
     * @example
     * Tone.Midi(60).toFrequency(); // 261.6255653005986
     */
    toFrequency() {
        return mtof(this.toMidi());
    }
    /**
     * Transposes the frequency by the given number of semitones.
     * @return A new transposed MidiClass
     * @example
     * Tone.Midi("A4").transpose(3); // "C5"
     */
    transpose(interval) {
        return new MidiClass(this.context, this.toMidi() + interval);
    }
}
/**
 * Convert a value into a FrequencyClass object.
 * @category Unit
 */
function Midi(value, units) {
    return new MidiClass(getContext(), value, units);
}

/**
 * Ticks is a primitive type for encoding Time values.
 * Ticks can be constructed with or without the `new` keyword. Ticks can be passed
 * into the parameter of any method which takes time as an argument.
 * @example
 * const t = Tone.Ticks("4n"); // a quarter note as ticks
 * @category Unit
 */
class TicksClass extends TransportTimeClass {
    constructor() {
        super(...arguments);
        this.name = "Ticks";
        this.defaultUnits = "i";
    }
    /**
     * Get the current time in the given units
     */
    _now() {
        return this.context.transport.ticks;
    }
    /**
     * Return the value of the beats in the current units
     */
    _beatsToUnits(beats) {
        return this._getPPQ() * beats;
    }
    /**
     * Returns the value of a second in the current units
     */
    _secondsToUnits(seconds) {
        return Math.floor(seconds / (60 / this._getBpm()) * this._getPPQ());
    }
    /**
     * Returns the value of a tick in the current time units
     */
    _ticksToUnits(ticks) {
        return ticks;
    }
    /**
     * Return the time in ticks
     */
    toTicks() {
        return this.valueOf();
    }
    /**
     * Return the time in seconds
     */
    toSeconds() {
        return (this.valueOf() / this._getPPQ()) * (60 / this._getBpm());
    }
}
/**
 * Convert a time representation to ticks
 * @category Unit
 */
function Ticks(value, units) {
    return new TicksClass(getContext(), value, units);
}

/**
 * Draw is useful for synchronizing visuals and audio events.
 * Callbacks from Tone.Transport or any of the Tone.Event classes
 * always happen _before_ the scheduled time and are not synchronized
 * to the animation frame so they are not good for triggering tightly
 * synchronized visuals and sound. Draw makes it easy to schedule
 * callbacks using the AudioContext time and uses requestAnimationFrame.
 * @example
 * Tone.Transport.schedule((time) => {
 * 	// use the time argument to schedule a callback with Draw
 * 	Tone.Draw.schedule(() => {
 * 		// do drawing or DOM manipulation here
 * 		console.log(time);
 * 	}, time);
 * }, "+0.5");
 * Tone.Transport.start();
 * @category Core
 */
class Draw extends ToneWithContext {
    constructor() {
        super(...arguments);
        this.name = "Draw";
        /**
         * The duration after which events are not invoked.
         */
        this.expiration = 0.25;
        /**
         * The amount of time before the scheduled time
         * that the callback can be invoked. Default is
         * half the time of an animation frame (0.008 seconds).
         */
        this.anticipation = 0.008;
        /**
         * All of the events.
         */
        this._events = new Timeline();
        /**
         * The draw loop
         */
        this._boundDrawLoop = this._drawLoop.bind(this);
        /**
         * The animation frame id
         */
        this._animationFrame = -1;
    }
    /**
     * Schedule a function at the given time to be invoked
     * on the nearest animation frame.
     * @param  callback  Callback is invoked at the given time.
     * @param  time      The time relative to the AudioContext time to invoke the callback.
     * @example
     * Tone.Transport.scheduleRepeat(time => {
     * 	Tone.Draw.schedule(() => console.log(time), time);
     * }, 1);
     * Tone.Transport.start();
     */
    schedule(callback, time) {
        this._events.add({
            callback,
            time: this.toSeconds(time),
        });
        // start the draw loop on the first event
        if (this._events.length === 1) {
            this._animationFrame = requestAnimationFrame(this._boundDrawLoop);
        }
        return this;
    }
    /**
     * Cancel events scheduled after the given time
     * @param  after  Time after which scheduled events will be removed from the scheduling timeline.
     */
    cancel(after) {
        this._events.cancel(this.toSeconds(after));
        return this;
    }
    /**
     * The draw loop
     */
    _drawLoop() {
        const now = this.context.currentTime;
        while (this._events.length && this._events.peek().time - this.anticipation <= now) {
            const event = this._events.shift();
            if (event && now - event.time <= this.expiration) {
                event.callback();
            }
        }
        if (this._events.length > 0) {
            this._animationFrame = requestAnimationFrame(this._boundDrawLoop);
        }
    }
    dispose() {
        super.dispose();
        this._events.dispose();
        cancelAnimationFrame(this._animationFrame);
        return this;
    }
}
//-------------------------------------
// 	INITIALIZATION
//-------------------------------------
onContextInit(context => {
    context.draw = new Draw({ context });
});
onContextClose(context => {
    context.draw.dispose();
});

/**
 * Similar to Tone.Timeline, but all events represent
 * intervals with both "time" and "duration" times. The
 * events are placed in a tree structure optimized
 * for querying an intersection point with the timeline
 * events. Internally uses an [Interval Tree](https://en.wikipedia.org/wiki/Interval_tree)
 * to represent the data.
 */
class IntervalTimeline extends Tone {
    constructor() {
        super(...arguments);
        this.name = "IntervalTimeline";
        /**
         * The root node of the inteval tree
         */
        this._root = null;
        /**
         * Keep track of the length of the timeline.
         */
        this._length = 0;
    }
    /**
     * The event to add to the timeline. All events must
     * have a time and duration value
     * @param  event  The event to add to the timeline
     */
    add(event) {
        assert(isDefined(event.time), "Events must have a time property");
        assert(isDefined(event.duration), "Events must have a duration parameter");
        event.time = event.time.valueOf();
        let node = new IntervalNode(event.time, event.time + event.duration, event);
        if (this._root === null) {
            this._root = node;
        }
        else {
            this._root.insert(node);
        }
        this._length++;
        // Restructure tree to be balanced
        while (node !== null) {
            node.updateHeight();
            node.updateMax();
            this._rebalance(node);
            node = node.parent;
        }
        return this;
    }
    /**
     * Remove an event from the timeline.
     * @param  event  The event to remove from the timeline
     */
    remove(event) {
        if (this._root !== null) {
            const results = [];
            this._root.search(event.time, results);
            for (const node of results) {
                if (node.event === event) {
                    this._removeNode(node);
                    this._length--;
                    break;
                }
            }
        }
        return this;
    }
    /**
     * The number of items in the timeline.
     * @readOnly
     */
    get length() {
        return this._length;
    }
    /**
     * Remove events whose time time is after the given time
     * @param  after  The time to query.
     */
    cancel(after) {
        this.forEachFrom(after, event => this.remove(event));
        return this;
    }
    /**
     * Set the root node as the given node
     */
    _setRoot(node) {
        this._root = node;
        if (this._root !== null) {
            this._root.parent = null;
        }
    }
    /**
     * Replace the references to the node in the node's parent
     * with the replacement node.
     */
    _replaceNodeInParent(node, replacement) {
        if (node.parent !== null) {
            if (node.isLeftChild()) {
                node.parent.left = replacement;
            }
            else {
                node.parent.right = replacement;
            }
            this._rebalance(node.parent);
        }
        else {
            this._setRoot(replacement);
        }
    }
    /**
     * Remove the node from the tree and replace it with
     * a successor which follows the schema.
     */
    _removeNode(node) {
        if (node.left === null && node.right === null) {
            this._replaceNodeInParent(node, null);
        }
        else if (node.right === null) {
            this._replaceNodeInParent(node, node.left);
        }
        else if (node.left === null) {
            this._replaceNodeInParent(node, node.right);
        }
        else {
            const balance = node.getBalance();
            let replacement;
            let temp = null;
            if (balance > 0) {
                if (node.left.right === null) {
                    replacement = node.left;
                    replacement.right = node.right;
                    temp = replacement;
                }
                else {
                    replacement = node.left.right;
                    while (replacement.right !== null) {
                        replacement = replacement.right;
                    }
                    if (replacement.parent) {
                        replacement.parent.right = replacement.left;
                        temp = replacement.parent;
                        replacement.left = node.left;
                        replacement.right = node.right;
                    }
                }
            }
            else if (node.right.left === null) {
                replacement = node.right;
                replacement.left = node.left;
                temp = replacement;
            }
            else {
                replacement = node.right.left;
                while (replacement.left !== null) {
                    replacement = replacement.left;
                }
                if (replacement.parent) {
                    replacement.parent.left = replacement.right;
                    temp = replacement.parent;
                    replacement.left = node.left;
                    replacement.right = node.right;
                }
            }
            if (node.parent !== null) {
                if (node.isLeftChild()) {
                    node.parent.left = replacement;
                }
                else {
                    node.parent.right = replacement;
                }
            }
            else {
                this._setRoot(replacement);
            }
            if (temp) {
                this._rebalance(temp);
            }
        }
        node.dispose();
    }
    /**
     * Rotate the tree to the left
     */
    _rotateLeft(node) {
        const parent = node.parent;
        const isLeftChild = node.isLeftChild();
        // Make node.right the new root of this sub tree (instead of node)
        const pivotNode = node.right;
        if (pivotNode) {
            node.right = pivotNode.left;
            pivotNode.left = node;
        }
        if (parent !== null) {
            if (isLeftChild) {
                parent.left = pivotNode;
            }
            else {
                parent.right = pivotNode;
            }
        }
        else {
            this._setRoot(pivotNode);
        }
    }
    /**
     * Rotate the tree to the right
     */
    _rotateRight(node) {
        const parent = node.parent;
        const isLeftChild = node.isLeftChild();
        // Make node.left the new root of this sub tree (instead of node)
        const pivotNode = node.left;
        if (pivotNode) {
            node.left = pivotNode.right;
            pivotNode.right = node;
        }
        if (parent !== null) {
            if (isLeftChild) {
                parent.left = pivotNode;
            }
            else {
                parent.right = pivotNode;
            }
        }
        else {
            this._setRoot(pivotNode);
        }
    }
    /**
     * Balance the BST
     */
    _rebalance(node) {
        const balance = node.getBalance();
        if (balance > 1 && node.left) {
            if (node.left.getBalance() < 0) {
                this._rotateLeft(node.left);
            }
            else {
                this._rotateRight(node);
            }
        }
        else if (balance < -1 && node.right) {
            if (node.right.getBalance() > 0) {
                this._rotateRight(node.right);
            }
            else {
                this._rotateLeft(node);
            }
        }
    }
    /**
     * Get an event whose time and duration span the give time. Will
     * return the match whose "time" value is closest to the given time.
     * @return  The event which spans the desired time
     */
    get(time) {
        if (this._root !== null) {
            const results = [];
            this._root.search(time, results);
            if (results.length > 0) {
                let max = results[0];
                for (let i = 1; i < results.length; i++) {
                    if (results[i].low > max.low) {
                        max = results[i];
                    }
                }
                return max.event;
            }
        }
        return null;
    }
    /**
     * Iterate over everything in the timeline.
     * @param  callback The callback to invoke with every item
     */
    forEach(callback) {
        if (this._root !== null) {
            const allNodes = [];
            this._root.traverse(node => allNodes.push(node));
            allNodes.forEach(node => {
                if (node.event) {
                    callback(node.event);
                }
            });
        }
        return this;
    }
    /**
     * Iterate over everything in the array in which the given time
     * overlaps with the time and duration time of the event.
     * @param  time The time to check if items are overlapping
     * @param  callback The callback to invoke with every item
     */
    forEachAtTime(time, callback) {
        if (this._root !== null) {
            const results = [];
            this._root.search(time, results);
            results.forEach(node => {
                if (node.event) {
                    callback(node.event);
                }
            });
        }
        return this;
    }
    /**
     * Iterate over everything in the array in which the time is greater
     * than or equal to the given time.
     * @param  time The time to check if items are before
     * @param  callback The callback to invoke with every item
     */
    forEachFrom(time, callback) {
        if (this._root !== null) {
            const results = [];
            this._root.searchAfter(time, results);
            results.forEach(node => {
                if (node.event) {
                    callback(node.event);
                }
            });
        }
        return this;
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        if (this._root !== null) {
            this._root.traverse(node => node.dispose());
        }
        this._root = null;
        return this;
    }
}
//-------------------------------------
// 	INTERVAL NODE HELPER
//-------------------------------------
/**
 * Represents a node in the binary search tree, with the addition
 * of a "high" value which keeps track of the highest value of
 * its children.
 * References:
 * https://brooknovak.wordpress.com/2013/12/07/augmented-interval-tree-in-c/
 * http://www.mif.vu.lt/~valdas/ALGORITMAI/LITERATURA/Cormen/Cormen.pdf
 * @param low
 * @param high
 */
class IntervalNode {
    constructor(low, high, event) {
        // the nodes to the left
        this._left = null;
        // the nodes to the right
        this._right = null;
        // the parent node
        this.parent = null;
        // the number of child nodes
        this.height = 0;
        this.event = event;
        // the low value
        this.low = low;
        // the high value
        this.high = high;
        // the high value for this and all child nodes
        this.max = this.high;
    }
    /**
     * Insert a node into the correct spot in the tree
     */
    insert(node) {
        if (node.low <= this.low) {
            if (this.left === null) {
                this.left = node;
            }
            else {
                this.left.insert(node);
            }
        }
        else if (this.right === null) {
            this.right = node;
        }
        else {
            this.right.insert(node);
        }
    }
    /**
     * Search the tree for nodes which overlap
     * with the given point
     * @param  point  The point to query
     * @param  results  The array to put the results
     */
    search(point, results) {
        // If p is to the right of the rightmost point of any interval
        // in this node and all children, there won't be any matches.
        if (point > this.max) {
            return;
        }
        // Search left children
        if (this.left !== null) {
            this.left.search(point, results);
        }
        // Check this node
        if (this.low <= point && this.high > point) {
            results.push(this);
        }
        // If p is to the left of the time of this interval,
        // then it can't be in any child to the right.
        if (this.low > point) {
            return;
        }
        // Search right children
        if (this.right !== null) {
            this.right.search(point, results);
        }
    }
    /**
     * Search the tree for nodes which are less
     * than the given point
     * @param  point  The point to query
     * @param  results  The array to put the results
     */
    searchAfter(point, results) {
        // Check this node
        if (this.low >= point) {
            results.push(this);
            if (this.left !== null) {
                this.left.searchAfter(point, results);
            }
        }
        // search the right side
        if (this.right !== null) {
            this.right.searchAfter(point, results);
        }
    }
    /**
     * Invoke the callback on this element and both it's branches
     * @param  {Function}  callback
     */
    traverse(callback) {
        callback(this);
        if (this.left !== null) {
            this.left.traverse(callback);
        }
        if (this.right !== null) {
            this.right.traverse(callback);
        }
    }
    /**
     * Update the height of the node
     */
    updateHeight() {
        if (this.left !== null && this.right !== null) {
            this.height = Math.max(this.left.height, this.right.height) + 1;
        }
        else if (this.right !== null) {
            this.height = this.right.height + 1;
        }
        else if (this.left !== null) {
            this.height = this.left.height + 1;
        }
        else {
            this.height = 0;
        }
    }
    /**
     * Update the height of the node
     */
    updateMax() {
        this.max = this.high;
        if (this.left !== null) {
            this.max = Math.max(this.max, this.left.max);
        }
        if (this.right !== null) {
            this.max = Math.max(this.max, this.right.max);
        }
    }
    /**
     * The balance is how the leafs are distributed on the node
     * @return  Negative numbers are balanced to the right
     */
    getBalance() {
        let balance = 0;
        if (this.left !== null && this.right !== null) {
            balance = this.left.height - this.right.height;
        }
        else if (this.left !== null) {
            balance = this.left.height + 1;
        }
        else if (this.right !== null) {
            balance = -(this.right.height + 1);
        }
        return balance;
    }
    /**
     * @returns true if this node is the left child of its parent
     */
    isLeftChild() {
        return this.parent !== null && this.parent.left === this;
    }
    /**
     * get/set the left node
     */
    get left() {
        return this._left;
    }
    set left(node) {
        this._left = node;
        if (node !== null) {
            node.parent = this;
        }
        this.updateHeight();
        this.updateMax();
    }
    /**
     * get/set the right node
     */
    get right() {
        return this._right;
    }
    set right(node) {
        this._right = node;
        if (node !== null) {
            node.parent = this;
        }
        this.updateHeight();
        this.updateMax();
    }
    /**
     * null out references.
     */
    dispose() {
        this.parent = null;
        this._left = null;
        this._right = null;
        this.event = null;
    }
}

/**
 * Volume is a simple volume node, useful for creating a volume fader.
 *
 * @example
 * const vol = new Tone.Volume(-12).toDestination();
 * const osc = new Tone.Oscillator().connect(vol).start();
 * @category Component
 */
class Volume extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Volume.getDefaults(), arguments, ["volume"]));
        this.name = "Volume";
        const options = optionsFromArguments(Volume.getDefaults(), arguments, ["volume"]);
        this.input = this.output = new Gain({
            context: this.context,
            gain: options.volume,
            units: "decibels",
        });
        this.volume = this.output.gain;
        readOnly(this, "volume");
        this._unmutedVolume = options.volume;
        // set the mute initially
        this.mute = options.mute;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            mute: false,
            volume: 0,
        });
    }
    /**
     * Mute the output.
     * @example
     * const vol = new Tone.Volume(-12).toDestination();
     * const osc = new Tone.Oscillator().connect(vol).start();
     * // mute the output
     * vol.mute = true;
     */
    get mute() {
        return this.volume.value === -Infinity;
    }
    set mute(mute) {
        if (!this.mute && mute) {
            this._unmutedVolume = this.volume.value;
            // maybe it should ramp here?
            this.volume.value = -Infinity;
        }
        else if (this.mute && !mute) {
            this.volume.value = this._unmutedVolume;
        }
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this.input.dispose();
        this.volume.dispose();
        return this;
    }
}

/**
 * A single master output which is connected to the
 * AudioDestinationNode (aka your speakers).
 * It provides useful conveniences such as the ability
 * to set the volume and mute the entire application.
 * It also gives you the ability to apply master effects to your application.
 *
 * @example
 * const oscillator = new Tone.Oscillator().start();
 * // the audio will go from the oscillator to the speakers
 * oscillator.connect(Tone.getDestination());
 * // a convenience for connecting to the master output is also provided:
 * oscillator.toDestination();
 * @category Core
 */
class Destination extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Destination.getDefaults(), arguments));
        this.name = "Destination";
        this.input = new Volume({ context: this.context });
        this.output = new Gain({ context: this.context });
        /**
         * The volume of the master output in decibels. -Infinity is silent, and 0 is no change.
         * @example
         * const osc = new Tone.Oscillator().toDestination();
         * osc.start();
         * // ramp the volume down to silent over 10 seconds
         * Tone.getDestination().volume.rampTo(-Infinity, 10);
         */
        this.volume = this.input.volume;
        const options = optionsFromArguments(Destination.getDefaults(), arguments);
        connectSeries(this.input, this.output, this.context.rawContext.destination);
        this.mute = options.mute;
        this._internalChannels = [this.input, this.context.rawContext.destination, this.output];
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            mute: false,
            volume: 0,
        });
    }
    /**
     * Mute the output.
     * @example
     * const oscillator = new Tone.Oscillator().start().toDestination();
     * setTimeout(() => {
     * 	// mute the output
     * 	Tone.Destination.mute = true;
     * }, 1000);
     */
    get mute() {
        return this.input.mute;
    }
    set mute(mute) {
        this.input.mute = mute;
    }
    /**
     * Add a master effects chain. NOTE: this will disconnect any nodes which were previously
     * chained in the master effects chain.
     * @param args All arguments will be connected in a row and the Master will be routed through it.
     * @example
     * // route all audio through a filter and compressor
     * const lowpass = new Tone.Filter(800, "lowpass");
     * const compressor = new Tone.Compressor(-18);
     * Tone.Destination.chain(lowpass, compressor);
     */
    chain(...args) {
        this.input.disconnect();
        args.unshift(this.input);
        args.push(this.output);
        connectSeries(...args);
        return this;
    }
    /**
     * The maximum number of channels the system can output
     * @example
     * console.log(Tone.Destination.maxChannelCount);
     */
    get maxChannelCount() {
        return this.context.rawContext.destination.maxChannelCount;
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this.volume.dispose();
        return this;
    }
}
//-------------------------------------
// 	INITIALIZATION
//-------------------------------------
onContextInit(context => {
    context.destination = new Destination({ context });
});
onContextClose(context => {
    context.destination.dispose();
});

/**
 * Represents a single value which is gettable and settable in a timed way
 */
class TimelineValue extends Tone {
    /**
     * @param initialValue The value to return if there is no scheduled values
     */
    constructor(initialValue) {
        super();
        this.name = "TimelineValue";
        /**
         * The timeline which stores the values
         */
        this._timeline = new Timeline({ memory: 10 });
        this._initialValue = initialValue;
    }
    /**
     * Set the value at the given time
     */
    set(value, time) {
        this._timeline.add({
            value, time
        });
        return this;
    }
    /**
     * Get the value at the given time
     */
    get(time) {
        const event = this._timeline.get(time);
        if (event) {
            return event.value;
        }
        else {
            return this._initialValue;
        }
    }
}

/**
 * TransportEvent is an internal class used by [[Transport]]
 * to schedule events. Do no invoke this class directly, it is
 * handled from within Tone.Transport.
 */
class TransportEvent {
    /**
     * @param transport The transport object which the event belongs to
     */
    constructor(transport, opts) {
        /**
         * The unique id of the event
         */
        this.id = TransportEvent._eventId++;
        const options = Object.assign(TransportEvent.getDefaults(), opts);
        this.transport = transport;
        this.callback = options.callback;
        this._once = options.once;
        this.time = options.time;
    }
    static getDefaults() {
        return {
            callback: noOp,
            once: false,
            time: 0,
        };
    }
    /**
     * Invoke the event callback.
     * @param  time  The AudioContext time in seconds of the event
     */
    invoke(time) {
        if (this.callback) {
            this.callback(time);
            if (this._once) {
                this.transport.clear(this.id);
            }
        }
    }
    /**
     * Clean up
     */
    dispose() {
        this.callback = undefined;
        return this;
    }
}
/**
 * Current ID counter
 */
TransportEvent._eventId = 0;

/**
 * TransportRepeatEvent is an internal class used by Tone.Transport
 * to schedule repeat events. This class should not be instantiated directly.
 */
class TransportRepeatEvent extends TransportEvent {
    /**
     * @param transport The transport object which the event belongs to
     */
    constructor(transport, opts) {
        super(transport, opts);
        /**
         * The ID of the current timeline event
         */
        this._currentId = -1;
        /**
         * The ID of the next timeline event
         */
        this._nextId = -1;
        /**
         * The time of the next event
         */
        this._nextTick = this.time;
        /**
         * a reference to the bound start method
         */
        this._boundRestart = this._restart.bind(this);
        const options = Object.assign(TransportRepeatEvent.getDefaults(), opts);
        this.duration = new TicksClass(transport.context, options.duration).valueOf();
        this._interval = new TicksClass(transport.context, options.interval).valueOf();
        this._nextTick = options.time;
        this.transport.on("start", this._boundRestart);
        this.transport.on("loopStart", this._boundRestart);
        this.context = this.transport.context;
        this._restart();
    }
    static getDefaults() {
        return Object.assign({}, TransportEvent.getDefaults(), {
            duration: Infinity,
            interval: 1,
            once: false,
        });
    }
    /**
     * Invoke the callback. Returns the tick time which
     * the next event should be scheduled at.
     * @param  time  The AudioContext time in seconds of the event
     */
    invoke(time) {
        // create more events if necessary
        this._createEvents(time);
        // call the super class
        super.invoke(time);
    }
    /**
     * Push more events onto the timeline to keep up with the position of the timeline
     */
    _createEvents(time) {
        // schedule the next event
        const ticks = this.transport.getTicksAtTime(time);
        if (ticks >= this.time && ticks >= this._nextTick && this._nextTick + this._interval < this.time + this.duration) {
            this._nextTick += this._interval;
            this._currentId = this._nextId;
            this._nextId = this.transport.scheduleOnce(this.invoke.bind(this), new TicksClass(this.context, this._nextTick).toSeconds());
        }
    }
    /**
     * Push more events onto the timeline to keep up with the position of the timeline
     */
    _restart(time) {
        this.transport.clear(this._currentId);
        this.transport.clear(this._nextId);
        this._nextTick = this.time;
        const ticks = this.transport.getTicksAtTime(time);
        if (ticks > this.time) {
            this._nextTick = this.time + Math.ceil((ticks - this.time) / this._interval) * this._interval;
        }
        this._currentId = this.transport.scheduleOnce(this.invoke.bind(this), new TicksClass(this.context, this._nextTick).toSeconds());
        this._nextTick += this._interval;
        this._nextId = this.transport.scheduleOnce(this.invoke.bind(this), new TicksClass(this.context, this._nextTick).toSeconds());
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this.transport.clear(this._currentId);
        this.transport.clear(this._nextId);
        this.transport.off("start", this._boundRestart);
        this.transport.off("loopStart", this._boundRestart);
        return this;
    }
}

/**
 * Transport for timing musical events.
 * Supports tempo curves and time changes. Unlike browser-based timing (setInterval, requestAnimationFrame)
 * Transport timing events pass in the exact time of the scheduled event
 * in the argument of the callback function. Pass that time value to the object
 * you're scheduling. <br><br>
 * A single transport is created for you when the library is initialized.
 * <br><br>
 * The transport emits the events: "start", "stop", "pause", and "loop" which are
 * called with the time of that event as the argument.
 *
 * @example
 * const osc = new Tone.Oscillator().toDestination();
 * // repeated event every 8th note
 * Tone.Transport.scheduleRepeat((time) => {
 * 	// use the callback time to schedule events
 * 	osc.start(time).stop(time + 0.1);
 * }, "8n");
 * // transport must be started before it starts invoking events
 * Tone.Transport.start();
 * @category Core
 */
class Transport extends ToneWithContext {
    constructor() {
        super(optionsFromArguments(Transport.getDefaults(), arguments));
        this.name = "Transport";
        //-------------------------------------
        // 	LOOPING
        //-------------------------------------
        /**
         * If the transport loops or not.
         */
        this._loop = new TimelineValue(false);
        /**
         * The loop start position in ticks
         */
        this._loopStart = 0;
        /**
         * The loop end position in ticks
         */
        this._loopEnd = 0;
        //-------------------------------------
        // 	TIMELINE EVENTS
        //-------------------------------------
        /**
         * All the events in an object to keep track by ID
         */
        this._scheduledEvents = {};
        /**
         * The scheduled events.
         */
        this._timeline = new Timeline();
        /**
         * Repeated events
         */
        this._repeatedEvents = new IntervalTimeline();
        /**
         * All of the synced Signals
         */
        this._syncedSignals = [];
        /**
         * The swing amount
         */
        this._swingAmount = 0;
        const options = optionsFromArguments(Transport.getDefaults(), arguments);
        // CLOCK/TEMPO
        this._ppq = options.ppq;
        this._clock = new Clock({
            callback: this._processTick.bind(this),
            context: this.context,
            frequency: 0,
            units: "bpm",
        });
        this._bindClockEvents();
        this.bpm = this._clock.frequency;
        this._clock.frequency.multiplier = options.ppq;
        this.bpm.setValueAtTime(options.bpm, 0);
        readOnly(this, "bpm");
        this._timeSignature = options.timeSignature;
        // SWING
        this._swingTicks = options.ppq / 2; // 8n
    }
    static getDefaults() {
        return Object.assign(ToneWithContext.getDefaults(), {
            bpm: 120,
            loopEnd: "4m",
            loopStart: 0,
            ppq: 192,
            swing: 0,
            swingSubdivision: "8n",
            timeSignature: 4,
        });
    }
    //-------------------------------------
    // 	TICKS
    //-------------------------------------
    /**
     * called on every tick
     * @param  tickTime clock relative tick time
     */
    _processTick(tickTime, ticks) {
        // do the loop test
        if (this._loop.get(tickTime)) {
            if (ticks >= this._loopEnd) {
                this.emit("loopEnd", tickTime);
                this._clock.setTicksAtTime(this._loopStart, tickTime);
                ticks = this._loopStart;
                this.emit("loopStart", tickTime, this._clock.getSecondsAtTime(tickTime));
                this.emit("loop", tickTime);
            }
        }
        // handle swing
        if (this._swingAmount > 0 &&
            ticks % this._ppq !== 0 && // not on a downbeat
            ticks % (this._swingTicks * 2) !== 0) {
            // add some swing
            const progress = (ticks % (this._swingTicks * 2)) / (this._swingTicks * 2);
            const amount = Math.sin((progress) * Math.PI) * this._swingAmount;
            tickTime += new TicksClass(this.context, this._swingTicks * 2 / 3).toSeconds() * amount;
        }
        // invoke the timeline events scheduled on this tick
        this._timeline.forEachAtTime(ticks, event => event.invoke(tickTime));
    }
    //-------------------------------------
    // 	SCHEDULABLE EVENTS
    //-------------------------------------
    /**
     * Schedule an event along the timeline.
     * @param callback The callback to be invoked at the time.
     * @param time The time to invoke the callback at.
     * @return The id of the event which can be used for canceling the event.
     * @example
     * // schedule an event on the 16th measure
     * Tone.Transport.schedule((time) => {
     * 	// invoked on measure 16
     * 	console.log("measure 16!");
     * }, "16:0:0");
     */
    schedule(callback, time) {
        const event = new TransportEvent(this, {
            callback,
            time: new TransportTimeClass(this.context, time).toTicks(),
        });
        return this._addEvent(event, this._timeline);
    }
    /**
     * Schedule a repeated event along the timeline. The event will fire
     * at the `interval` starting at the `startTime` and for the specified
     * `duration`.
     * @param  callback   The callback to invoke.
     * @param  interval   The duration between successive callbacks. Must be a positive number.
     * @param  startTime  When along the timeline the events should start being invoked.
     * @param  duration How long the event should repeat.
     * @return  The ID of the scheduled event. Use this to cancel the event.
     * @example
     * const osc = new Tone.Oscillator().toDestination().start();
     * // a callback invoked every eighth note after the first measure
     * Tone.Transport.scheduleRepeat((time) => {
     * 	osc.start(time).stop(time + 0.1);
     * }, "8n", "1m");
     */
    scheduleRepeat(callback, interval, startTime, duration = Infinity) {
        const event = new TransportRepeatEvent(this, {
            callback,
            duration: new TimeClass(this.context, duration).toTicks(),
            interval: new TimeClass(this.context, interval).toTicks(),
            time: new TransportTimeClass(this.context, startTime).toTicks(),
        });
        // kick it off if the Transport is started
        // @ts-ignore
        return this._addEvent(event, this._repeatedEvents);
    }
    /**
     * Schedule an event that will be removed after it is invoked.
     * @param callback The callback to invoke once.
     * @param time The time the callback should be invoked.
     * @returns The ID of the scheduled event.
     */
    scheduleOnce(callback, time) {
        const event = new TransportEvent(this, {
            callback,
            once: true,
            time: new TransportTimeClass(this.context, time).toTicks(),
        });
        return this._addEvent(event, this._timeline);
    }
    /**
     * Clear the passed in event id from the timeline
     * @param eventId The id of the event.
     */
    clear(eventId) {
        if (this._scheduledEvents.hasOwnProperty(eventId)) {
            const item = this._scheduledEvents[eventId.toString()];
            item.timeline.remove(item.event);
            item.event.dispose();
            delete this._scheduledEvents[eventId.toString()];
        }
        return this;
    }
    /**
     * Add an event to the correct timeline. Keep track of the
     * timeline it was added to.
     * @returns the event id which was just added
     */
    _addEvent(event, timeline) {
        this._scheduledEvents[event.id.toString()] = {
            event,
            timeline,
        };
        timeline.add(event);
        return event.id;
    }
    /**
     * Remove scheduled events from the timeline after
     * the given time. Repeated events will be removed
     * if their startTime is after the given time
     * @param after Clear all events after this time.
     */
    cancel(after = 0) {
        const computedAfter = this.toTicks(after);
        this._timeline.forEachFrom(computedAfter, event => this.clear(event.id));
        this._repeatedEvents.forEachFrom(computedAfter, event => this.clear(event.id));
        return this;
    }
    //-------------------------------------
    // 	START/STOP/PAUSE
    //-------------------------------------
    /**
     * Bind start/stop/pause events from the clock and emit them.
     */
    _bindClockEvents() {
        this._clock.on("start", (time, offset) => {
            offset = new TicksClass(this.context, offset).toSeconds();
            this.emit("start", time, offset);
        });
        this._clock.on("stop", (time) => {
            this.emit("stop", time);
        });
        this._clock.on("pause", (time) => {
            this.emit("pause", time);
        });
    }
    /**
     * Returns the playback state of the source, either "started", "stopped", or "paused"
     */
    get state() {
        return this._clock.getStateAtTime(this.now());
    }
    /**
     * Start the transport and all sources synced to the transport.
     * @param  time The time when the transport should start.
     * @param  offset The timeline offset to start the transport.
     * @example
     * // start the transport in one second starting at beginning of the 5th measure.
     * Tone.Transport.start("+1", "4:0:0");
     */
    start(time, offset) {
        let offsetTicks;
        if (isDefined(offset)) {
            offsetTicks = this.toTicks(offset);
        }
        // start the clock
        this._clock.start(time, offsetTicks);
        return this;
    }
    /**
     * Stop the transport and all sources synced to the transport.
     * @param time The time when the transport should stop.
     * @example
     * Tone.Transport.stop();
     */
    stop(time) {
        this._clock.stop(time);
        return this;
    }
    /**
     * Pause the transport and all sources synced to the transport.
     */
    pause(time) {
        this._clock.pause(time);
        return this;
    }
    /**
     * Toggle the current state of the transport. If it is
     * started, it will stop it, otherwise it will start the Transport.
     * @param  time The time of the event
     */
    toggle(time) {
        time = this.toSeconds(time);
        if (this._clock.getStateAtTime(time) !== "started") {
            this.start(time);
        }
        else {
            this.stop(time);
        }
        return this;
    }
    //-------------------------------------
    // 	SETTERS/GETTERS
    //-------------------------------------
    /**
     * The time signature as just the numerator over 4.
     * For example 4/4 would be just 4 and 6/8 would be 3.
     * @example
     * // common time
     * Tone.Transport.timeSignature = 4;
     * // 7/8
     * Tone.Transport.timeSignature = [7, 8];
     * // this will be reduced to a single number
     * Tone.Transport.timeSignature; // returns 3.5
     */
    get timeSignature() {
        return this._timeSignature;
    }
    set timeSignature(timeSig) {
        if (isArray(timeSig)) {
            timeSig = (timeSig[0] / timeSig[1]) * 4;
        }
        this._timeSignature = timeSig;
    }
    /**
     * When the Transport.loop = true, this is the starting position of the loop.
     */
    get loopStart() {
        return new TimeClass(this.context, this._loopStart, "i").toSeconds();
    }
    set loopStart(startPosition) {
        this._loopStart = this.toTicks(startPosition);
    }
    /**
     * When the Transport.loop = true, this is the ending position of the loop.
     */
    get loopEnd() {
        return new TimeClass(this.context, this._loopEnd, "i").toSeconds();
    }
    set loopEnd(endPosition) {
        this._loopEnd = this.toTicks(endPosition);
    }
    /**
     * If the transport loops or not.
     */
    get loop() {
        return this._loop.get(this.now());
    }
    set loop(loop) {
        this._loop.set(loop, this.now());
    }
    /**
     * Set the loop start and stop at the same time.
     * @example
     * // loop over the first measure
     * Tone.Transport.setLoopPoints(0, "1m");
     * Tone.Transport.loop = true;
     */
    setLoopPoints(startPosition, endPosition) {
        this.loopStart = startPosition;
        this.loopEnd = endPosition;
        return this;
    }
    /**
     * The swing value. Between 0-1 where 1 equal to the note + half the subdivision.
     */
    get swing() {
        return this._swingAmount;
    }
    set swing(amount) {
        // scale the values to a normal range
        this._swingAmount = amount;
    }
    /**
     * Set the subdivision which the swing will be applied to.
     * The default value is an 8th note. Value must be less
     * than a quarter note.
     */
    get swingSubdivision() {
        return new TicksClass(this.context, this._swingTicks).toNotation();
    }
    set swingSubdivision(subdivision) {
        this._swingTicks = this.toTicks(subdivision);
    }
    /**
     * The Transport's position in Bars:Beats:Sixteenths.
     * Setting the value will jump to that position right away.
     */
    get position() {
        const now = this.now();
        const ticks = this._clock.getTicksAtTime(now);
        return new TicksClass(this.context, ticks).toBarsBeatsSixteenths();
    }
    set position(progress) {
        const ticks = this.toTicks(progress);
        this.ticks = ticks;
    }
    /**
     * The Transport's position in seconds
     * Setting the value will jump to that position right away.
     */
    get seconds() {
        return this._clock.seconds;
    }
    set seconds(s) {
        const now = this.now();
        const ticks = this._clock.frequency.timeToTicks(s, now);
        this.ticks = ticks;
    }
    /**
     * The Transport's loop position as a normalized value. Always
     * returns 0 if the transport if loop is not true.
     */
    get progress() {
        if (this.loop) {
            const now = this.now();
            const ticks = this._clock.getTicksAtTime(now);
            return (ticks - this._loopStart) / (this._loopEnd - this._loopStart);
        }
        else {
            return 0;
        }
    }
    /**
     * The transports current tick position.
     */
    get ticks() {
        return this._clock.ticks;
    }
    set ticks(t) {
        if (this._clock.ticks !== t) {
            const now = this.now();
            // stop everything synced to the transport
            if (this.state === "started") {
                const ticks = this._clock.getTicksAtTime(now);
                // schedule to start on the next tick, #573
                const remainingTick = this._clock.frequency.getDurationOfTicks(Math.ceil(ticks) - ticks, now);
                const time = now + remainingTick;
                this.emit("stop", time);
                this._clock.setTicksAtTime(t, time);
                // restart it with the new time
                this.emit("start", time, this._clock.getSecondsAtTime(time));
            }
            else {
                this._clock.setTicksAtTime(t, now);
            }
        }
    }
    /**
     * Get the clock's ticks at the given time.
     * @param  time  When to get the tick value
     * @return The tick value at the given time.
     */
    getTicksAtTime(time) {
        return Math.round(this._clock.getTicksAtTime(time));
    }
    /**
     * Return the elapsed seconds at the given time.
     * @param  time  When to get the elapsed seconds
     * @return  The number of elapsed seconds
     */
    getSecondsAtTime(time) {
        return this._clock.getSecondsAtTime(time);
    }
    /**
     * Pulses Per Quarter note. This is the smallest resolution
     * the Transport timing supports. This should be set once
     * on initialization and not set again. Changing this value
     * after other objects have been created can cause problems.
     */
    get PPQ() {
        return this._clock.frequency.multiplier;
    }
    set PPQ(ppq) {
        this._clock.frequency.multiplier = ppq;
    }
    //-------------------------------------
    // 	SYNCING
    //-------------------------------------
    /**
     * Returns the time aligned to the next subdivision
     * of the Transport. If the Transport is not started,
     * it will return 0.
     * Note: this will not work precisely during tempo ramps.
     * @param  subdivision  The subdivision to quantize to
     * @return  The context time of the next subdivision.
     * @example
     * // the transport must be started, otherwise returns 0
     * Tone.Transport.start();
     * Tone.Transport.nextSubdivision("4n");
     */
    nextSubdivision(subdivision) {
        subdivision = this.toTicks(subdivision);
        if (this.state !== "started") {
            // if the transport's not started, return 0
            return 0;
        }
        else {
            const now = this.now();
            // the remainder of the current ticks and the subdivision
            const transportPos = this.getTicksAtTime(now);
            const remainingTicks = subdivision - transportPos % subdivision;
            return this._clock.nextTickTime(remainingTicks, now);
        }
    }
    /**
     * Attaches the signal to the tempo control signal so that
     * any changes in the tempo will change the signal in the same
     * ratio.
     *
     * @param signal
     * @param ratio Optionally pass in the ratio between the two signals.
     * 			Otherwise it will be computed based on their current values.
     */
    syncSignal(signal, ratio) {
        if (!ratio) {
            // get the sync ratio
            const now = this.now();
            if (signal.getValueAtTime(now) !== 0) {
                const bpm = this.bpm.getValueAtTime(now);
                const computedFreq = 1 / (60 / bpm / this.PPQ);
                ratio = signal.getValueAtTime(now) / computedFreq;
            }
            else {
                ratio = 0;
            }
        }
        const ratioSignal = new Gain(ratio);
        // @ts-ignore
        this.bpm.connect(ratioSignal);
        // @ts-ignore
        ratioSignal.connect(signal._param);
        this._syncedSignals.push({
            initial: signal.value,
            ratio: ratioSignal,
            signal,
        });
        signal.value = 0;
        return this;
    }
    /**
     * Unsyncs a previously synced signal from the transport's control.
     * See Transport.syncSignal.
     */
    unsyncSignal(signal) {
        for (let i = this._syncedSignals.length - 1; i >= 0; i--) {
            const syncedSignal = this._syncedSignals[i];
            if (syncedSignal.signal === signal) {
                syncedSignal.ratio.dispose();
                syncedSignal.signal.value = syncedSignal.initial;
                this._syncedSignals.splice(i, 1);
            }
        }
        return this;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._clock.dispose();
        writable(this, "bpm");
        this._timeline.dispose();
        this._repeatedEvents.dispose();
        return this;
    }
}
Emitter.mixin(Transport);
//-------------------------------------
// 	INITIALIZATION
//-------------------------------------
onContextInit(context => {
    context.transport = new Transport({ context });
});
onContextClose(context => {
    context.transport.dispose();
});

/**
 * Base class for sources.
 * start/stop of this.context.transport.
 *
 * ```
 * // Multiple state change events can be chained together,
 * // but must be set in the correct order and with ascending times
 * // OK
 * state.start().stop("+0.2");
 * // OK
 * state.start().stop("+0.2").start("+0.4").stop("+0.7")
 * // BAD
 * state.stop("+0.2").start();
 * // BAD
 * state.start("+0.3").stop("+0.2");
 * ```
 */
class Source extends ToneAudioNode {
    constructor(options) {
        super(options);
        /**
         * Sources have no inputs
         */
        this.input = undefined;
        /**
         * Keep track of the scheduled state.
         */
        this._state = new StateTimeline("stopped");
        /**
         * The synced `start` callback function from the transport
         */
        this._synced = false;
        /**
         * Keep track of all of the scheduled event ids
         */
        this._scheduled = [];
        /**
         * Placeholder functions for syncing/unsyncing to transport
         */
        this._syncedStart = noOp;
        this._syncedStop = noOp;
        this._state.memory = 100;
        this._state.increasing = true;
        this._volume = this.output = new Volume({
            context: this.context,
            mute: options.mute,
            volume: options.volume,
        });
        this.volume = this._volume.volume;
        readOnly(this, "volume");
        this.onstop = options.onstop;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            mute: false,
            onstop: noOp,
            volume: 0,
        });
    }
    /**
     * Returns the playback state of the source, either "started" or "stopped".
     * @example
     * const player = new Tone.Player("https://tonejs.github.io/audio/berklee/ahntone_c3.mp3", () => {
     * 	player.start();
     * 	console.log(player.state);
     * }).toDestination();
     */
    get state() {
        if (this._synced) {
            if (this.context.transport.state === "started") {
                return this._state.getValueAtTime(this.context.transport.seconds);
            }
            else {
                return "stopped";
            }
        }
        else {
            return this._state.getValueAtTime(this.now());
        }
    }
    /**
     * Mute the output.
     * @example
     * const osc = new Tone.Oscillator().toDestination().start();
     * // mute the output
     * osc.mute = true;
     */
    get mute() {
        return this._volume.mute;
    }
    set mute(mute) {
        this._volume.mute = mute;
    }
    /**
     * Ensure that the scheduled time is not before the current time.
     * Should only be used when scheduled unsynced.
     */
    _clampToCurrentTime(time) {
        if (this._synced) {
            return time;
        }
        else {
            return Math.max(time, this.context.currentTime);
        }
    }
    /**
     * Start the source at the specified time. If no time is given,
     * start the source now.
     * @param  time When the source should be started.
     * @example
     * const source = new Tone.Oscillator().toDestination();
     * source.start("+0.5"); // starts the source 0.5 seconds from now
     */
    start(time, offset, duration) {
        let computedTime = isUndef(time) && this._synced ? this.context.transport.seconds : this.toSeconds(time);
        computedTime = this._clampToCurrentTime(computedTime);
        // if it's started, stop it and restart it
        if (!this._synced && this._state.getValueAtTime(computedTime) === "started") {
            // time should be strictly greater than the previous start time
            assert(GT(computedTime, this._state.get(computedTime).time), "Start time must be strictly greater than previous start time");
            this._state.cancel(computedTime);
            this._state.setStateAtTime("started", computedTime);
            this.log("restart", computedTime);
            this.restart(computedTime, offset, duration);
        }
        else {
            this.log("start", computedTime);
            this._state.setStateAtTime("started", computedTime);
            if (this._synced) {
                // add the offset time to the event
                const event = this._state.get(computedTime);
                if (event) {
                    event.offset = this.toSeconds(defaultArg(offset, 0));
                    event.duration = duration ? this.toSeconds(duration) : undefined;
                }
                const sched = this.context.transport.schedule(t => {
                    this._start(t, offset, duration);
                }, computedTime);
                this._scheduled.push(sched);
                // if the transport is already started
                // and the time is greater than where the transport is
                if (this.context.transport.state === "started" &&
                    this.context.transport.getSecondsAtTime(this.immediate()) > computedTime) {
                    this._syncedStart(this.now(), this.context.transport.seconds);
                }
            }
            else {
                assertContextRunning(this.context);
                this._start(computedTime, offset, duration);
            }
        }
        return this;
    }
    /**
     * Stop the source at the specified time. If no time is given,
     * stop the source now.
     * @param  time When the source should be stopped.
     * @example
     * const source = new Tone.Oscillator().toDestination();
     * source.start();
     * source.stop("+0.5"); // stops the source 0.5 seconds from now
     */
    stop(time) {
        let computedTime = isUndef(time) && this._synced ? this.context.transport.seconds : this.toSeconds(time);
        computedTime = this._clampToCurrentTime(computedTime);
        if (this._state.getValueAtTime(computedTime) === "started" || isDefined(this._state.getNextState("started", computedTime))) {
            this.log("stop", computedTime);
            if (!this._synced) {
                this._stop(computedTime);
            }
            else {
                const sched = this.context.transport.schedule(this._stop.bind(this), computedTime);
                this._scheduled.push(sched);
            }
            this._state.cancel(computedTime);
            this._state.setStateAtTime("stopped", computedTime);
        }
        return this;
    }
    /**
     * Restart the source.
     */
    restart(time, offset, duration) {
        time = this.toSeconds(time);
        if (this._state.getValueAtTime(time) === "started") {
            this._state.cancel(time);
            this._restart(time, offset, duration);
        }
        return this;
    }
    /**
     * Sync the source to the Transport so that all subsequent
     * calls to `start` and `stop` are synced to the TransportTime
     * instead of the AudioContext time.
     *
     * @example
     * const osc = new Tone.Oscillator().toDestination();
     * // sync the source so that it plays between 0 and 0.3 on the Transport's timeline
     * osc.sync().start(0).stop(0.3);
     * // start the transport.
     * Tone.Transport.start();
     * // set it to loop once a second
     * Tone.Transport.loop = true;
     * Tone.Transport.loopEnd = 1;
     */
    sync() {
        if (!this._synced) {
            this._synced = true;
            this._syncedStart = (time, offset) => {
                if (offset > 0) {
                    // get the playback state at that time
                    const stateEvent = this._state.get(offset);
                    // listen for start events which may occur in the middle of the sync'ed time
                    if (stateEvent && stateEvent.state === "started" && stateEvent.time !== offset) {
                        // get the offset
                        const startOffset = offset - this.toSeconds(stateEvent.time);
                        let duration;
                        if (stateEvent.duration) {
                            duration = this.toSeconds(stateEvent.duration) - startOffset;
                        }
                        this._start(time, this.toSeconds(stateEvent.offset) + startOffset, duration);
                    }
                }
            };
            this._syncedStop = time => {
                const seconds = this.context.transport.getSecondsAtTime(Math.max(time - this.sampleTime, 0));
                if (this._state.getValueAtTime(seconds) === "started") {
                    this._stop(time);
                }
            };
            this.context.transport.on("start", this._syncedStart);
            this.context.transport.on("loopStart", this._syncedStart);
            this.context.transport.on("stop", this._syncedStop);
            this.context.transport.on("pause", this._syncedStop);
            this.context.transport.on("loopEnd", this._syncedStop);
        }
        return this;
    }
    /**
     * Unsync the source to the Transport. See Source.sync
     */
    unsync() {
        if (this._synced) {
            this.context.transport.off("stop", this._syncedStop);
            this.context.transport.off("pause", this._syncedStop);
            this.context.transport.off("loopEnd", this._syncedStop);
            this.context.transport.off("start", this._syncedStart);
            this.context.transport.off("loopStart", this._syncedStart);
        }
        this._synced = false;
        // clear all of the scheduled ids
        this._scheduled.forEach(id => this.context.transport.clear(id));
        this._scheduled = [];
        this._state.cancel(0);
        // stop it also
        this._stop(0);
        return this;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this.onstop = noOp;
        this.unsync();
        this._volume.dispose();
        this._state.dispose();
        return this;
    }
}

/**
 * Wrapper around the native BufferSourceNode.
 * @category Source
 */
class ToneBufferSource extends OneShotSource {
    constructor() {
        super(optionsFromArguments(ToneBufferSource.getDefaults(), arguments, ["url", "onload"]));
        this.name = "ToneBufferSource";
        /**
         * The oscillator
         */
        this._source = this.context.createBufferSource();
        this._internalChannels = [this._source];
        /**
         * indicators if the source has started/stopped
         */
        this._sourceStarted = false;
        this._sourceStopped = false;
        const options = optionsFromArguments(ToneBufferSource.getDefaults(), arguments, ["url", "onload"]);
        connect(this._source, this._gainNode);
        this._source.onended = () => this._stopSource();
        /**
         * The playbackRate of the buffer
         */
        this.playbackRate = new Param({
            context: this.context,
            param: this._source.playbackRate,
            units: "positive",
            value: options.playbackRate,
        });
        // set some values initially
        this.loop = options.loop;
        this.loopStart = options.loopStart;
        this.loopEnd = options.loopEnd;
        this._buffer = new ToneAudioBuffer(options.url, options.onload, options.onerror);
        this._internalChannels.push(this._source);
    }
    static getDefaults() {
        return Object.assign(OneShotSource.getDefaults(), {
            url: new ToneAudioBuffer(),
            loop: false,
            loopEnd: 0,
            loopStart: 0,
            onload: noOp,
            onerror: noOp,
            playbackRate: 1,
        });
    }
    /**
     * The fadeIn time of the amplitude envelope.
     */
    get fadeIn() {
        return this._fadeIn;
    }
    set fadeIn(t) {
        this._fadeIn = t;
    }
    /**
     * The fadeOut time of the amplitude envelope.
     */
    get fadeOut() {
        return this._fadeOut;
    }
    set fadeOut(t) {
        this._fadeOut = t;
    }
    /**
     * The curve applied to the fades, either "linear" or "exponential"
     */
    get curve() {
        return this._curve;
    }
    set curve(t) {
        this._curve = t;
    }
    /**
     * Start the buffer
     * @param  time When the player should start.
     * @param  offset The offset from the beginning of the sample to start at.
     * @param  duration How long the sample should play. If no duration is given, it will default to the full length of the sample (minus any offset)
     * @param  gain  The gain to play the buffer back at.
     */
    start(time, offset, duration, gain = 1) {
        assert(this.buffer.loaded, "buffer is either not set or not loaded");
        const computedTime = this.toSeconds(time);
        // apply the gain envelope
        this._startGain(computedTime, gain);
        // if it's a loop the default offset is the loopstart point
        if (this.loop) {
            offset = defaultArg(offset, this.loopStart);
        }
        else {
            // otherwise the default offset is 0
            offset = defaultArg(offset, 0);
        }
        // make sure the offset is not less than 0
        let computedOffset = Math.max(this.toSeconds(offset), 0);
        // start the buffer source
        if (this.loop) {
            // modify the offset if it's greater than the loop time
            const loopEnd = this.toSeconds(this.loopEnd) || this.buffer.duration;
            const loopStart = this.toSeconds(this.loopStart);
            const loopDuration = loopEnd - loopStart;
            // move the offset back
            if (GTE(computedOffset, loopEnd)) {
                computedOffset = ((computedOffset - loopStart) % loopDuration) + loopStart;
            }
            // when the offset is very close to the duration, set it to 0
            if (EQ(computedOffset, this.buffer.duration)) {
                computedOffset = 0;
            }
        }
        // this.buffer.loaded would have return false if the AudioBuffer was undefined
        this._source.buffer = this.buffer.get();
        this._source.loopEnd = this.toSeconds(this.loopEnd) || this.buffer.duration;
        if (LT(computedOffset, this.buffer.duration)) {
            this._sourceStarted = true;
            this._source.start(computedTime, computedOffset);
        }
        // if a duration is given, schedule a stop
        if (isDefined(duration)) {
            let computedDur = this.toSeconds(duration);
            // make sure it's never negative
            computedDur = Math.max(computedDur, 0);
            this.stop(computedTime + computedDur);
        }
        return this;
    }
    _stopSource(time) {
        if (!this._sourceStopped && this._sourceStarted) {
            this._sourceStopped = true;
            this._source.stop(this.toSeconds(time));
            this._onended();
        }
    }
    /**
     * If loop is true, the loop will start at this position.
     */
    get loopStart() {
        return this._source.loopStart;
    }
    set loopStart(loopStart) {
        this._source.loopStart = this.toSeconds(loopStart);
    }
    /**
     * If loop is true, the loop will end at this position.
     */
    get loopEnd() {
        return this._source.loopEnd;
    }
    set loopEnd(loopEnd) {
        this._source.loopEnd = this.toSeconds(loopEnd);
    }
    /**
     * The audio buffer belonging to the player.
     */
    get buffer() {
        return this._buffer;
    }
    set buffer(buffer) {
        this._buffer.set(buffer);
    }
    /**
     * If the buffer should loop once it's over.
     */
    get loop() {
        return this._source.loop;
    }
    set loop(loop) {
        this._source.loop = loop;
        if (this._sourceStarted) {
            this.cancelStop();
        }
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._source.onended = null;
        this._source.disconnect();
        this._buffer.dispose();
        this.playbackRate.dispose();
        return this;
    }
}

/**
 * Render a segment of the oscillator to an offline context and return the results as an array
 */
function generateWaveform(instance, length) {
    return __awaiter(this, void 0, void 0, function* () {
        const duration = length / instance.context.sampleRate;
        const context = new OfflineContext(1, duration, instance.context.sampleRate);
        const clone = new instance.constructor(Object.assign(instance.get(), {
            // should do 2 iterations
            frequency: 2 / duration,
            // zero out the detune
            detune: 0,
            context
        })).toDestination();
        clone.start(0);
        const buffer = yield context.render();
        return buffer.getChannelData(0);
    });
}

/**
 * Wrapper around the native fire-and-forget OscillatorNode.
 * Adds the ability to reschedule the stop method.
 * ***[[Oscillator]] is better for most use-cases***
 * @category Source
 */
class ToneOscillatorNode extends OneShotSource {
    constructor() {
        super(optionsFromArguments(ToneOscillatorNode.getDefaults(), arguments, ["frequency", "type"]));
        this.name = "ToneOscillatorNode";
        /**
         * The oscillator
         */
        this._oscillator = this.context.createOscillator();
        this._internalChannels = [this._oscillator];
        const options = optionsFromArguments(ToneOscillatorNode.getDefaults(), arguments, ["frequency", "type"]);
        connect(this._oscillator, this._gainNode);
        this.type = options.type;
        this.frequency = new Param({
            context: this.context,
            param: this._oscillator.frequency,
            units: "frequency",
            value: options.frequency,
        });
        this.detune = new Param({
            context: this.context,
            param: this._oscillator.detune,
            units: "cents",
            value: options.detune,
        });
        readOnly(this, ["frequency", "detune"]);
    }
    static getDefaults() {
        return Object.assign(OneShotSource.getDefaults(), {
            detune: 0,
            frequency: 440,
            type: "sine",
        });
    }
    /**
     * Start the oscillator node at the given time
     * @param  time When to start the oscillator
     */
    start(time) {
        const computedTime = this.toSeconds(time);
        this.log("start", computedTime);
        this._startGain(computedTime);
        this._oscillator.start(computedTime);
        return this;
    }
    _stopSource(time) {
        this._oscillator.stop(time);
    }
    /**
     * Sets an arbitrary custom periodic waveform given a PeriodicWave.
     * @param  periodicWave PeriodicWave should be created with context.createPeriodicWave
     */
    setPeriodicWave(periodicWave) {
        this._oscillator.setPeriodicWave(periodicWave);
        return this;
    }
    /**
     * The oscillator type. Either 'sine', 'sawtooth', 'square', or 'triangle'
     */
    get type() {
        return this._oscillator.type;
    }
    set type(type) {
        this._oscillator.type = type;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        if (this.state === "started") {
            this.stop();
        }
        this._oscillator.disconnect();
        this.frequency.dispose();
        this.detune.dispose();
        return this;
    }
}

/**
 * Oscillator supports a number of features including
 * phase rotation, multiple oscillator types (see Oscillator.type),
 * and Transport syncing (see Oscillator.syncFrequency).
 *
 * @example
 * // make and start a 440hz sine tone
 * const osc = new Tone.Oscillator(440, "sine").toDestination().start();
 * @category Source
 */
class Oscillator extends Source {
    constructor() {
        super(optionsFromArguments(Oscillator.getDefaults(), arguments, ["frequency", "type"]));
        this.name = "Oscillator";
        /**
         * the main oscillator
         */
        this._oscillator = null;
        const options = optionsFromArguments(Oscillator.getDefaults(), arguments, ["frequency", "type"]);
        this.frequency = new Signal({
            context: this.context,
            units: "frequency",
            value: options.frequency,
        });
        readOnly(this, "frequency");
        this.detune = new Signal({
            context: this.context,
            units: "cents",
            value: options.detune,
        });
        readOnly(this, "detune");
        this._partials = options.partials;
        this._partialCount = options.partialCount;
        this._type = options.type;
        if (options.partialCount && options.type !== "custom") {
            this._type = this.baseType + options.partialCount.toString();
        }
        this.phase = options.phase;
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            detune: 0,
            frequency: 440,
            partialCount: 0,
            partials: [],
            phase: 0,
            type: "sine",
        });
    }
    /**
     * start the oscillator
     */
    _start(time) {
        const computedTime = this.toSeconds(time);
        // new oscillator with previous values
        const oscillator = new ToneOscillatorNode({
            context: this.context,
            onended: () => this.onstop(this),
        });
        this._oscillator = oscillator;
        if (this._wave) {
            this._oscillator.setPeriodicWave(this._wave);
        }
        else {
            this._oscillator.type = this._type;
        }
        // connect the control signal to the oscillator frequency & detune
        this._oscillator.connect(this.output);
        this.frequency.connect(this._oscillator.frequency);
        this.detune.connect(this._oscillator.detune);
        // start the oscillator
        this._oscillator.start(computedTime);
    }
    /**
     * stop the oscillator
     */
    _stop(time) {
        const computedTime = this.toSeconds(time);
        if (this._oscillator) {
            this._oscillator.stop(computedTime);
        }
    }
    /**
     * Restart the oscillator. Does not stop the oscillator, but instead
     * just cancels any scheduled 'stop' from being invoked.
     */
    _restart(time) {
        const computedTime = this.toSeconds(time);
        this.log("restart", computedTime);
        if (this._oscillator) {
            this._oscillator.cancelStop();
        }
        this._state.cancel(computedTime);
        return this;
    }
    /**
     * Sync the signal to the Transport's bpm. Any changes to the transports bpm,
     * will also affect the oscillators frequency.
     * @example
     * const osc = new Tone.Oscillator().toDestination().start();
     * osc.frequency.value = 440;
     * // the ratio between the bpm and the frequency will be maintained
     * osc.syncFrequency();
     * // double the tempo
     * Tone.Transport.bpm.value *= 2;
     * // the frequency of the oscillator is doubled to 880
     */
    syncFrequency() {
        this.context.transport.syncSignal(this.frequency);
        return this;
    }
    /**
     * Unsync the oscillator's frequency from the Transport.
     * See Oscillator.syncFrequency
     */
    unsyncFrequency() {
        this.context.transport.unsyncSignal(this.frequency);
        return this;
    }
    /**
     * Get a cached periodic wave. Avoids having to recompute
     * the oscillator values when they have already been computed
     * with the same values.
     */
    _getCachedPeriodicWave() {
        if (this._type === "custom") {
            const oscProps = Oscillator._periodicWaveCache.find(description => {
                return description.phase === this._phase &&
                    deepEquals(description.partials, this._partials);
            });
            return oscProps;
        }
        else {
            const oscProps = Oscillator._periodicWaveCache.find(description => {
                return description.type === this._type &&
                    description.phase === this._phase;
            });
            this._partialCount = oscProps ? oscProps.partialCount : this._partialCount;
            return oscProps;
        }
    }
    get type() {
        return this._type;
    }
    set type(type) {
        this._type = type;
        const isBasicType = ["sine", "square", "sawtooth", "triangle"].indexOf(type) !== -1;
        if (this._phase === 0 && isBasicType) {
            this._wave = undefined;
            this._partialCount = 0;
            // just go with the basic approach
            if (this._oscillator !== null) {
                // already tested that it's a basic type
                this._oscillator.type = type;
            }
        }
        else {
            // first check if the value is cached
            const cache = this._getCachedPeriodicWave();
            if (isDefined(cache)) {
                const { partials, wave } = cache;
                this._wave = wave;
                this._partials = partials;
                if (this._oscillator !== null) {
                    this._oscillator.setPeriodicWave(this._wave);
                }
            }
            else {
                const [real, imag] = this._getRealImaginary(type, this._phase);
                const periodicWave = this.context.createPeriodicWave(real, imag);
                this._wave = periodicWave;
                if (this._oscillator !== null) {
                    this._oscillator.setPeriodicWave(this._wave);
                }
                // set the cache
                Oscillator._periodicWaveCache.push({
                    imag,
                    partialCount: this._partialCount,
                    partials: this._partials,
                    phase: this._phase,
                    real,
                    type: this._type,
                    wave: this._wave,
                });
                if (Oscillator._periodicWaveCache.length > 100) {
                    Oscillator._periodicWaveCache.shift();
                }
            }
        }
    }
    get baseType() {
        return this._type.replace(this.partialCount.toString(), "");
    }
    set baseType(baseType) {
        if (this.partialCount && this._type !== "custom" && baseType !== "custom") {
            this.type = baseType + this.partialCount;
        }
        else {
            this.type = baseType;
        }
    }
    get partialCount() {
        return this._partialCount;
    }
    set partialCount(p) {
        assertRange(p, 0);
        let type = this._type;
        const partial = /^(sine|triangle|square|sawtooth)(\d+)$/.exec(this._type);
        if (partial) {
            type = partial[1];
        }
        if (this._type !== "custom") {
            if (p === 0) {
                this.type = type;
            }
            else {
                this.type = type + p.toString();
            }
        }
        else {
            // extend or shorten the partials array
            const fullPartials = new Float32Array(p);
            // copy over the partials array
            this._partials.forEach((v, i) => fullPartials[i] = v);
            this._partials = Array.from(fullPartials);
            this.type = this._type;
        }
    }
    /**
     * Returns the real and imaginary components based
     * on the oscillator type.
     * @returns [real: Float32Array, imaginary: Float32Array]
     */
    _getRealImaginary(type, phase) {
        const fftSize = 4096;
        let periodicWaveSize = fftSize / 2;
        const real = new Float32Array(periodicWaveSize);
        const imag = new Float32Array(periodicWaveSize);
        let partialCount = 1;
        if (type === "custom") {
            partialCount = this._partials.length + 1;
            this._partialCount = this._partials.length;
            periodicWaveSize = partialCount;
            // if the partial count is 0, don't bother doing any computation
            if (this._partials.length === 0) {
                return [real, imag];
            }
        }
        else {
            const partial = /^(sine|triangle|square|sawtooth)(\d+)$/.exec(type);
            if (partial) {
                partialCount = parseInt(partial[2], 10) + 1;
                this._partialCount = parseInt(partial[2], 10);
                type = partial[1];
                partialCount = Math.max(partialCount, 2);
                periodicWaveSize = partialCount;
            }
            else {
                this._partialCount = 0;
            }
            this._partials = [];
        }
        for (let n = 1; n < periodicWaveSize; ++n) {
            const piFactor = 2 / (n * Math.PI);
            let b;
            switch (type) {
                case "sine":
                    b = (n <= partialCount) ? 1 : 0;
                    this._partials[n - 1] = b;
                    break;
                case "square":
                    b = (n & 1) ? 2 * piFactor : 0;
                    this._partials[n - 1] = b;
                    break;
                case "sawtooth":
                    b = piFactor * ((n & 1) ? 1 : -1);
                    this._partials[n - 1] = b;
                    break;
                case "triangle":
                    if (n & 1) {
                        b = 2 * (piFactor * piFactor) * ((((n - 1) >> 1) & 1) ? -1 : 1);
                    }
                    else {
                        b = 0;
                    }
                    this._partials[n - 1] = b;
                    break;
                case "custom":
                    b = this._partials[n - 1];
                    break;
                default:
                    throw new TypeError("Oscillator: invalid type: " + type);
            }
            if (b !== 0) {
                real[n] = -b * Math.sin(phase * n);
                imag[n] = b * Math.cos(phase * n);
            }
            else {
                real[n] = 0;
                imag[n] = 0;
            }
        }
        return [real, imag];
    }
    /**
     * Compute the inverse FFT for a given phase.
     */
    _inverseFFT(real, imag, phase) {
        let sum = 0;
        const len = real.length;
        for (let i = 0; i < len; i++) {
            sum += real[i] * Math.cos(i * phase) + imag[i] * Math.sin(i * phase);
        }
        return sum;
    }
    /**
     * Returns the initial value of the oscillator when stopped.
     * E.g. a "sine" oscillator with phase = 90 would return an initial value of -1.
     */
    getInitialValue() {
        const [real, imag] = this._getRealImaginary(this._type, 0);
        let maxValue = 0;
        const twoPi = Math.PI * 2;
        const testPositions = 32;
        // check for peaks in 16 places
        for (let i = 0; i < testPositions; i++) {
            maxValue = Math.max(this._inverseFFT(real, imag, (i / testPositions) * twoPi), maxValue);
        }
        return clamp(-this._inverseFFT(real, imag, this._phase) / maxValue, -1, 1);
    }
    get partials() {
        return this._partials.slice(0, this.partialCount);
    }
    set partials(partials) {
        this._partials = partials;
        this._partialCount = this._partials.length;
        if (partials.length) {
            this.type = "custom";
        }
    }
    get phase() {
        return this._phase * (180 / Math.PI);
    }
    set phase(phase) {
        this._phase = phase * Math.PI / 180;
        // reset the type
        this.type = this._type;
    }
    asArray(length = 1024) {
        return __awaiter(this, void 0, void 0, function* () {
            return generateWaveform(this, length);
        });
    }
    dispose() {
        super.dispose();
        if (this._oscillator !== null) {
            this._oscillator.dispose();
        }
        this._wave = undefined;
        this.frequency.dispose();
        this.detune.dispose();
        return this;
    }
}
/**
 * Cache the periodic waves to avoid having to redo computations
 */
Oscillator._periodicWaveCache = [];

/**
 * A signal operator has an input and output and modifies the signal.
 */
class SignalOperator extends ToneAudioNode {
    constructor() {
        super(Object.assign(optionsFromArguments(SignalOperator.getDefaults(), arguments, ["context"])));
    }
    connect(destination, outputNum = 0, inputNum = 0) {
        connectSignal(this, destination, outputNum, inputNum);
        return this;
    }
}

/**
 * Wraps the native Web Audio API
 * [WaveShaperNode](http://webaudio.github.io/web-audio-api/#the-waveshapernode-interface).
 *
 * @example
 * const osc = new Tone.Oscillator().toDestination().start();
 * // multiply the output of the signal by 2 using the waveshaper's function
 * const timesTwo = new Tone.WaveShaper((val) => val * 2, 2048).connect(osc.frequency);
 * const signal = new Tone.Signal(440).connect(timesTwo);
 * @category Signal
 */
class WaveShaper extends SignalOperator {
    constructor() {
        super(Object.assign(optionsFromArguments(WaveShaper.getDefaults(), arguments, ["mapping", "length"])));
        this.name = "WaveShaper";
        /**
         * the waveshaper node
         */
        this._shaper = this.context.createWaveShaper();
        /**
         * The input to the waveshaper node.
         */
        this.input = this._shaper;
        /**
         * The output from the waveshaper node
         */
        this.output = this._shaper;
        const options = optionsFromArguments(WaveShaper.getDefaults(), arguments, ["mapping", "length"]);
        if (isArray(options.mapping) || options.mapping instanceof Float32Array) {
            this.curve = Float32Array.from(options.mapping);
        }
        else if (isFunction(options.mapping)) {
            this.setMap(options.mapping, options.length);
        }
    }
    static getDefaults() {
        return Object.assign(Signal.getDefaults(), {
            length: 1024,
        });
    }
    /**
     * Uses a mapping function to set the value of the curve.
     * @param mapping The function used to define the values.
     *                The mapping function take two arguments:
     *                the first is the value at the current position
     *                which goes from -1 to 1 over the number of elements
     *                in the curve array. The second argument is the array position.
     * @example
     * const shaper = new Tone.WaveShaper();
     * // map the input signal from [-1, 1] to [0, 10]
     * shaper.setMap((val, index) => (val + 1) * 5);
     */
    setMap(mapping, length = 1024) {
        const array = new Float32Array(length);
        for (let i = 0, len = length; i < len; i++) {
            const normalized = (i / (len - 1)) * 2 - 1;
            array[i] = mapping(normalized, i);
        }
        this.curve = array;
        return this;
    }
    /**
     * The array to set as the waveshaper curve. For linear curves
     * array length does not make much difference, but for complex curves
     * longer arrays will provide smoother interpolation.
     */
    get curve() {
        return this._shaper.curve;
    }
    set curve(mapping) {
        this._shaper.curve = mapping;
    }
    /**
     * Specifies what type of oversampling (if any) should be used when
     * applying the shaping curve. Can either be "none", "2x" or "4x".
     */
    get oversample() {
        return this._shaper.oversample;
    }
    set oversample(oversampling) {
        const isOverSampleType = ["none", "2x", "4x"].some(str => str.includes(oversampling));
        assert(isOverSampleType, "oversampling must be either 'none', '2x', or '4x'");
        this._shaper.oversample = oversampling;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._shaper.disconnect();
        return this;
    }
}

/**
 * AudioToGain converts an input in AudioRange [-1,1] to NormalRange [0,1].
 * See [[GainToAudio]].
 * @category Signal
 */
class AudioToGain extends SignalOperator {
    constructor() {
        super(...arguments);
        this.name = "AudioToGain";
        /**
         * The node which converts the audio ranges
         */
        this._norm = new WaveShaper({
            context: this.context,
            mapping: x => (x + 1) / 2,
        });
        /**
         * The AudioRange input [-1, 1]
         */
        this.input = this._norm;
        /**
         * The GainRange output [0, 1]
         */
        this.output = this._norm;
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this._norm.dispose();
        return this;
    }
}

/**
 * Multiply two incoming signals. Or, if a number is given in the constructor,
 * multiplies the incoming signal by that value.
 *
 * @example
 * // multiply two signals
 * const mult = new Tone.Multiply();
 * const sigA = new Tone.Signal(3);
 * const sigB = new Tone.Signal(4);
 * sigA.connect(mult);
 * sigB.connect(mult.factor);
 * // output of mult is 12.
 * @example
 * // multiply a signal and a number
 * const mult = new Tone.Multiply(10);
 * const sig = new Tone.Signal(2).connect(mult);
 * // the output of mult is 20.
 * @category Signal
 */
class Multiply extends Signal {
    constructor() {
        super(Object.assign(optionsFromArguments(Multiply.getDefaults(), arguments, ["value"])));
        this.name = "Multiply";
        /**
         * Indicates if the value should be overridden on connection
         */
        this.override = false;
        const options = optionsFromArguments(Multiply.getDefaults(), arguments, ["value"]);
        this._mult = this.input = this.output = new Gain({
            context: this.context,
            minValue: options.minValue,
            maxValue: options.maxValue,
        });
        this.factor = this._param = this._mult.gain;
        this.factor.setValueAtTime(options.value, 0);
    }
    static getDefaults() {
        return Object.assign(Signal.getDefaults(), {
            value: 0,
        });
    }
    dispose() {
        super.dispose();
        this._mult.dispose();
        return this;
    }
}

/**
 * An amplitude modulated oscillator node. It is implemented with
 * two oscillators, one which modulators the other's amplitude
 * through a gain node.
 * ```
 *    +-------------+       +----------+
 *    | Carrier Osc +>------> GainNode |
 *    +-------------+       |          +--->Output
 *                      +---> gain     |
 * +---------------+    |   +----------+
 * | Modulator Osc +>---+
 * +---------------+
 * ```
 * @example
 * return Tone.Offline(() => {
 * 	const amOsc = new Tone.AMOscillator(30, "sine", "square").toDestination().start();
 * }, 0.2, 1);
 * @category Source
 */
class AMOscillator extends Source {
    constructor() {
        super(optionsFromArguments(AMOscillator.getDefaults(), arguments, ["frequency", "type", "modulationType"]));
        this.name = "AMOscillator";
        /**
         * convert the -1,1 output to 0,1
         */
        this._modulationScale = new AudioToGain({ context: this.context });
        /**
         * the node where the modulation happens
         */
        this._modulationNode = new Gain({
            context: this.context,
        });
        const options = optionsFromArguments(AMOscillator.getDefaults(), arguments, ["frequency", "type", "modulationType"]);
        this._carrier = new Oscillator({
            context: this.context,
            detune: options.detune,
            frequency: options.frequency,
            onstop: () => this.onstop(this),
            phase: options.phase,
            type: options.type,
        });
        this.frequency = this._carrier.frequency,
            this.detune = this._carrier.detune;
        this._modulator = new Oscillator({
            context: this.context,
            phase: options.phase,
            type: options.modulationType,
        });
        this.harmonicity = new Multiply({
            context: this.context,
            units: "positive",
            value: options.harmonicity,
        });
        // connections
        this.frequency.chain(this.harmonicity, this._modulator.frequency);
        this._modulator.chain(this._modulationScale, this._modulationNode.gain);
        this._carrier.chain(this._modulationNode, this.output);
        readOnly(this, ["frequency", "detune", "harmonicity"]);
    }
    static getDefaults() {
        return Object.assign(Oscillator.getDefaults(), {
            harmonicity: 1,
            modulationType: "square",
        });
    }
    /**
     * start the oscillator
     */
    _start(time) {
        this._modulator.start(time);
        this._carrier.start(time);
    }
    /**
     * stop the oscillator
     */
    _stop(time) {
        this._modulator.stop(time);
        this._carrier.stop(time);
    }
    _restart(time) {
        this._modulator.restart(time);
        this._carrier.restart(time);
    }
    /**
     * The type of the carrier oscillator
     */
    get type() {
        return this._carrier.type;
    }
    set type(type) {
        this._carrier.type = type;
    }
    get baseType() {
        return this._carrier.baseType;
    }
    set baseType(baseType) {
        this._carrier.baseType = baseType;
    }
    get partialCount() {
        return this._carrier.partialCount;
    }
    set partialCount(partialCount) {
        this._carrier.partialCount = partialCount;
    }
    /**
     * The type of the modulator oscillator
     */
    get modulationType() {
        return this._modulator.type;
    }
    set modulationType(type) {
        this._modulator.type = type;
    }
    get phase() {
        return this._carrier.phase;
    }
    set phase(phase) {
        this._carrier.phase = phase;
        this._modulator.phase = phase;
    }
    get partials() {
        return this._carrier.partials;
    }
    set partials(partials) {
        this._carrier.partials = partials;
    }
    asArray(length = 1024) {
        return __awaiter(this, void 0, void 0, function* () {
            return generateWaveform(this, length);
        });
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this.frequency.dispose();
        this.detune.dispose();
        this.harmonicity.dispose();
        this._carrier.dispose();
        this._modulator.dispose();
        this._modulationNode.dispose();
        this._modulationScale.dispose();
        return this;
    }
}

/**
 * FMOscillator implements a frequency modulation synthesis
 * ```
 *                                              +-------------+
 * +---------------+        +-------------+     | Carrier Osc |
 * | Modulator Osc +>-------> GainNode    |     |             +--->Output
 * +---------------+        |             +>----> frequency   |
 *                       +--> gain        |     +-------------+
 *                       |  +-------------+
 * +-----------------+   |
 * | modulationIndex +>--+
 * +-----------------+
 * ```
 *
 * @example
 * return Tone.Offline(() => {
 * 	const fmOsc = new Tone.FMOscillator({
 * 		frequency: 200,
 * 		type: "square",
 * 		modulationType: "triangle",
 * 		harmonicity: 0.2,
 * 		modulationIndex: 3
 * 	}).toDestination().start();
 * }, 0.1, 1);
 * @category Source
 */
class FMOscillator extends Source {
    constructor() {
        super(optionsFromArguments(FMOscillator.getDefaults(), arguments, ["frequency", "type", "modulationType"]));
        this.name = "FMOscillator";
        /**
         * the node where the modulation happens
         */
        this._modulationNode = new Gain({
            context: this.context,
            gain: 0,
        });
        const options = optionsFromArguments(FMOscillator.getDefaults(), arguments, ["frequency", "type", "modulationType"]);
        this._carrier = new Oscillator({
            context: this.context,
            detune: options.detune,
            frequency: 0,
            onstop: () => this.onstop(this),
            phase: options.phase,
            type: options.type,
        });
        this.detune = this._carrier.detune;
        this.frequency = new Signal({
            context: this.context,
            units: "frequency",
            value: options.frequency,
        });
        this._modulator = new Oscillator({
            context: this.context,
            phase: options.phase,
            type: options.modulationType,
        });
        this.harmonicity = new Multiply({
            context: this.context,
            units: "positive",
            value: options.harmonicity,
        });
        this.modulationIndex = new Multiply({
            context: this.context,
            units: "positive",
            value: options.modulationIndex,
        });
        // connections
        this.frequency.connect(this._carrier.frequency);
        this.frequency.chain(this.harmonicity, this._modulator.frequency);
        this.frequency.chain(this.modulationIndex, this._modulationNode);
        this._modulator.connect(this._modulationNode.gain);
        this._modulationNode.connect(this._carrier.frequency);
        this._carrier.connect(this.output);
        this.detune.connect(this._modulator.detune);
        readOnly(this, ["modulationIndex", "frequency", "detune", "harmonicity"]);
    }
    static getDefaults() {
        return Object.assign(Oscillator.getDefaults(), {
            harmonicity: 1,
            modulationIndex: 2,
            modulationType: "square",
        });
    }
    /**
     * start the oscillator
     */
    _start(time) {
        this._modulator.start(time);
        this._carrier.start(time);
    }
    /**
     * stop the oscillator
     */
    _stop(time) {
        this._modulator.stop(time);
        this._carrier.stop(time);
    }
    _restart(time) {
        this._modulator.restart(time);
        this._carrier.restart(time);
        return this;
    }
    get type() {
        return this._carrier.type;
    }
    set type(type) {
        this._carrier.type = type;
    }
    get baseType() {
        return this._carrier.baseType;
    }
    set baseType(baseType) {
        this._carrier.baseType = baseType;
    }
    get partialCount() {
        return this._carrier.partialCount;
    }
    set partialCount(partialCount) {
        this._carrier.partialCount = partialCount;
    }
    /**
     * The type of the modulator oscillator
     */
    get modulationType() {
        return this._modulator.type;
    }
    set modulationType(type) {
        this._modulator.type = type;
    }
    get phase() {
        return this._carrier.phase;
    }
    set phase(phase) {
        this._carrier.phase = phase;
        this._modulator.phase = phase;
    }
    get partials() {
        return this._carrier.partials;
    }
    set partials(partials) {
        this._carrier.partials = partials;
    }
    asArray(length = 1024) {
        return __awaiter(this, void 0, void 0, function* () {
            return generateWaveform(this, length);
        });
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this.frequency.dispose();
        this.harmonicity.dispose();
        this._carrier.dispose();
        this._modulator.dispose();
        this._modulationNode.dispose();
        this.modulationIndex.dispose();
        return this;
    }
}

/**
 * PulseOscillator is an oscillator with control over pulse width,
 * also known as the duty cycle. At 50% duty cycle (width = 0) the wave is
 * a square wave.
 * [Read more](https://wigglewave.wordpress.com/2014/08/16/pulse-waveforms-and-harmonics/).
 * ```
 *    width = -0.25        width = 0.0          width = 0.25
 *
 *   +-----+            +-------+       +    +-------+     +-+
 *   |     |            |       |       |            |     |
 *   |     |            |       |       |            |     |
 * +-+     +-------+    +       +-------+            +-----+
 *
 *
 *    width = -0.5                              width = 0.5
 *
 *     +---+                                 +-------+   +---+
 *     |   |                                         |   |
 *     |   |                                         |   |
 * +---+   +-------+                                 +---+
 *
 *
 *    width = -0.75                             width = 0.75
 *
 *       +-+                                 +-------+ +-----+
 *       | |                                         | |
 *       | |                                         | |
 * +-----+ +-------+                                 +-+
 * ```
 * @example
 * return Tone.Offline(() => {
 * 	const pulse = new Tone.PulseOscillator(50, 0.4).toDestination().start();
 * }, 0.1, 1);
 * @category Source
 */
class PulseOscillator extends Source {
    constructor() {
        super(optionsFromArguments(PulseOscillator.getDefaults(), arguments, ["frequency", "width"]));
        this.name = "PulseOscillator";
        /**
         * gate the width amount
         */
        this._widthGate = new Gain({
            context: this.context,
            gain: 0,
        });
        /**
         * Threshold the signal to turn it into a square
         */
        this._thresh = new WaveShaper({
            context: this.context,
            mapping: val => val <= 0 ? -1 : 1,
        });
        const options = optionsFromArguments(PulseOscillator.getDefaults(), arguments, ["frequency", "width"]);
        this.width = new Signal({
            context: this.context,
            units: "audioRange",
            value: options.width,
        });
        this._triangle = new Oscillator({
            context: this.context,
            detune: options.detune,
            frequency: options.frequency,
            onstop: () => this.onstop(this),
            phase: options.phase,
            type: "triangle",
        });
        this.frequency = this._triangle.frequency;
        this.detune = this._triangle.detune;
        // connections
        this._triangle.chain(this._thresh, this.output);
        this.width.chain(this._widthGate, this._thresh);
        readOnly(this, ["width", "frequency", "detune"]);
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            detune: 0,
            frequency: 440,
            phase: 0,
            type: "pulse",
            width: 0.2,
        });
    }
    /**
     * start the oscillator
     */
    _start(time) {
        time = this.toSeconds(time);
        this._triangle.start(time);
        this._widthGate.gain.setValueAtTime(1, time);
    }
    /**
     * stop the oscillator
     */
    _stop(time) {
        time = this.toSeconds(time);
        this._triangle.stop(time);
        // the width is still connected to the output.
        // that needs to be stopped also
        this._widthGate.gain.cancelScheduledValues(time);
        this._widthGate.gain.setValueAtTime(0, time);
    }
    _restart(time) {
        this._triangle.restart(time);
        this._widthGate.gain.cancelScheduledValues(time);
        this._widthGate.gain.setValueAtTime(1, time);
    }
    /**
     * The phase of the oscillator in degrees.
     */
    get phase() {
        return this._triangle.phase;
    }
    set phase(phase) {
        this._triangle.phase = phase;
    }
    /**
     * The type of the oscillator. Always returns "pulse".
     */
    get type() {
        return "pulse";
    }
    /**
     * The baseType of the oscillator. Always returns "pulse".
     */
    get baseType() {
        return "pulse";
    }
    /**
     * The partials of the waveform. Cannot set partials for this waveform type
     */
    get partials() {
        return [];
    }
    /**
     * No partials for this waveform type.
     */
    get partialCount() {
        return 0;
    }
    /**
     * *Internal use* The carrier oscillator type is fed through the
     * waveshaper node to create the pulse. Using different carrier oscillators
     * changes oscillator's behavior.
     */
    set carrierType(type) {
        this._triangle.type = type;
    }
    asArray(length = 1024) {
        return __awaiter(this, void 0, void 0, function* () {
            return generateWaveform(this, length);
        });
    }
    /**
     * Clean up method.
     */
    dispose() {
        super.dispose();
        this._triangle.dispose();
        this.width.dispose();
        this._widthGate.dispose();
        this._thresh.dispose();
        return this;
    }
}

/**
 * FatOscillator is an array of oscillators with detune spread between the oscillators
 * @example
 * const fatOsc = new Tone.FatOscillator("Ab3", "sawtooth", 40).toDestination().start();
 * @category Source
 */
class FatOscillator extends Source {
    constructor() {
        super(optionsFromArguments(FatOscillator.getDefaults(), arguments, ["frequency", "type", "spread"]));
        this.name = "FatOscillator";
        /**
         * The array of oscillators
         */
        this._oscillators = [];
        const options = optionsFromArguments(FatOscillator.getDefaults(), arguments, ["frequency", "type", "spread"]);
        this.frequency = new Signal({
            context: this.context,
            units: "frequency",
            value: options.frequency,
        });
        this.detune = new Signal({
            context: this.context,
            units: "cents",
            value: options.detune,
        });
        this._spread = options.spread;
        this._type = options.type;
        this._phase = options.phase;
        this._partials = options.partials;
        this._partialCount = options.partialCount;
        // set the count initially
        this.count = options.count;
        readOnly(this, ["frequency", "detune"]);
    }
    static getDefaults() {
        return Object.assign(Oscillator.getDefaults(), {
            count: 3,
            spread: 20,
            type: "sawtooth",
        });
    }
    /**
     * start the oscillator
     */
    _start(time) {
        time = this.toSeconds(time);
        this._forEach(osc => osc.start(time));
    }
    /**
     * stop the oscillator
     */
    _stop(time) {
        time = this.toSeconds(time);
        this._forEach(osc => osc.stop(time));
    }
    _restart(time) {
        this._forEach(osc => osc.restart(time));
    }
    /**
     * Iterate over all of the oscillators
     */
    _forEach(iterator) {
        for (let i = 0; i < this._oscillators.length; i++) {
            iterator(this._oscillators[i], i);
        }
    }
    /**
     * The type of the oscillator
     */
    get type() {
        return this._type;
    }
    set type(type) {
        this._type = type;
        this._forEach(osc => osc.type = type);
    }
    /**
     * The detune spread between the oscillators. If "count" is
     * set to 3 oscillators and the "spread" is set to 40,
     * the three oscillators would be detuned like this: [-20, 0, 20]
     * for a total detune spread of 40 cents.
     * @example
     * const fatOsc = new Tone.FatOscillator().toDestination().start();
     * fatOsc.spread = 70;
     */
    get spread() {
        return this._spread;
    }
    set spread(spread) {
        this._spread = spread;
        if (this._oscillators.length > 1) {
            const start = -spread / 2;
            const step = spread / (this._oscillators.length - 1);
            this._forEach((osc, i) => osc.detune.value = start + step * i);
        }
    }
    /**
     * The number of detuned oscillators. Must be an integer greater than 1.
     * @example
     * const fatOsc = new Tone.FatOscillator("C#3", "sawtooth").toDestination().start();
     * // use 4 sawtooth oscillators
     * fatOsc.count = 4;
     */
    get count() {
        return this._oscillators.length;
    }
    set count(count) {
        assertRange(count, 1);
        if (this._oscillators.length !== count) {
            // dispose the previous oscillators
            this._forEach(osc => osc.dispose());
            this._oscillators = [];
            for (let i = 0; i < count; i++) {
                const osc = new Oscillator({
                    context: this.context,
                    volume: -6 - count * 1.1,
                    type: this._type,
                    phase: this._phase + (i / count) * 360,
                    partialCount: this._partialCount,
                    onstop: i === 0 ? () => this.onstop(this) : noOp,
                });
                if (this.type === "custom") {
                    osc.partials = this._partials;
                }
                this.frequency.connect(osc.frequency);
                this.detune.connect(osc.detune);
                osc.detune.overridden = false;
                osc.connect(this.output);
                this._oscillators[i] = osc;
            }
            // set the spread
            this.spread = this._spread;
            if (this.state === "started") {
                this._forEach(osc => osc.start());
            }
        }
    }
    get phase() {
        return this._phase;
    }
    set phase(phase) {
        this._phase = phase;
        this._forEach((osc, i) => osc.phase = this._phase + (i / this.count) * 360);
    }
    get baseType() {
        return this._oscillators[0].baseType;
    }
    set baseType(baseType) {
        this._forEach(osc => osc.baseType = baseType);
        this._type = this._oscillators[0].type;
    }
    get partials() {
        return this._oscillators[0].partials;
    }
    set partials(partials) {
        this._partials = partials;
        this._partialCount = this._partials.length;
        if (partials.length) {
            this._type = "custom";
            this._forEach(osc => osc.partials = partials);
        }
    }
    get partialCount() {
        return this._oscillators[0].partialCount;
    }
    set partialCount(partialCount) {
        this._partialCount = partialCount;
        this._forEach(osc => osc.partialCount = partialCount);
        this._type = this._oscillators[0].type;
    }
    asArray(length = 1024) {
        return __awaiter(this, void 0, void 0, function* () {
            return generateWaveform(this, length);
        });
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this.frequency.dispose();
        this.detune.dispose();
        this._forEach(osc => osc.dispose());
        return this;
    }
}

/**
 * PWMOscillator modulates the width of a Tone.PulseOscillator
 * at the modulationFrequency. This has the effect of continuously
 * changing the timbre of the oscillator by altering the harmonics
 * generated.
 * @example
 * return Tone.Offline(() => {
 * 	const pwm = new Tone.PWMOscillator(60, 0.3).toDestination().start();
 * }, 0.1, 1);
 * @category Source
 */
class PWMOscillator extends Source {
    constructor() {
        super(optionsFromArguments(PWMOscillator.getDefaults(), arguments, ["frequency", "modulationFrequency"]));
        this.name = "PWMOscillator";
        this.sourceType = "pwm";
        /**
         * Scale the oscillator so it doesn't go silent
         * at the extreme values.
         */
        this._scale = new Multiply({
            context: this.context,
            value: 2,
        });
        const options = optionsFromArguments(PWMOscillator.getDefaults(), arguments, ["frequency", "modulationFrequency"]);
        this._pulse = new PulseOscillator({
            context: this.context,
            frequency: options.modulationFrequency,
        });
        // change the pulse oscillator type
        this._pulse.carrierType = "sine";
        this.modulationFrequency = this._pulse.frequency;
        this._modulator = new Oscillator({
            context: this.context,
            detune: options.detune,
            frequency: options.frequency,
            onstop: () => this.onstop(this),
            phase: options.phase,
        });
        this.frequency = this._modulator.frequency;
        this.detune = this._modulator.detune;
        // connections
        this._modulator.chain(this._scale, this._pulse.width);
        this._pulse.connect(this.output);
        readOnly(this, ["modulationFrequency", "frequency", "detune"]);
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            detune: 0,
            frequency: 440,
            modulationFrequency: 0.4,
            phase: 0,
            type: "pwm",
        });
    }
    /**
     * start the oscillator
     */
    _start(time) {
        time = this.toSeconds(time);
        this._modulator.start(time);
        this._pulse.start(time);
    }
    /**
     * stop the oscillator
     */
    _stop(time) {
        time = this.toSeconds(time);
        this._modulator.stop(time);
        this._pulse.stop(time);
    }
    /**
     * restart the oscillator
     */
    _restart(time) {
        this._modulator.restart(time);
        this._pulse.restart(time);
    }
    /**
     * The type of the oscillator. Always returns "pwm".
     */
    get type() {
        return "pwm";
    }
    /**
     * The baseType of the oscillator. Always returns "pwm".
     */
    get baseType() {
        return "pwm";
    }
    /**
     * The partials of the waveform. Cannot set partials for this waveform type
     */
    get partials() {
        return [];
    }
    /**
     * No partials for this waveform type.
     */
    get partialCount() {
        return 0;
    }
    /**
     * The phase of the oscillator in degrees.
     */
    get phase() {
        return this._modulator.phase;
    }
    set phase(phase) {
        this._modulator.phase = phase;
    }
    asArray(length = 1024) {
        return __awaiter(this, void 0, void 0, function* () {
            return generateWaveform(this, length);
        });
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._pulse.dispose();
        this._scale.dispose();
        this._modulator.dispose();
        return this;
    }
}

const OmniOscillatorSourceMap = {
    am: AMOscillator,
    fat: FatOscillator,
    fm: FMOscillator,
    oscillator: Oscillator,
    pulse: PulseOscillator,
    pwm: PWMOscillator,
};
/**
 * OmniOscillator aggregates all of the oscillator types into one.
 * @example
 * return Tone.Offline(() => {
 * 	const omniOsc = new Tone.OmniOscillator("C#4", "pwm").toDestination().start();
 * }, 0.1, 1);
 * @category Source
 */
class OmniOscillator extends Source {
    constructor() {
        super(optionsFromArguments(OmniOscillator.getDefaults(), arguments, ["frequency", "type"]));
        this.name = "OmniOscillator";
        const options = optionsFromArguments(OmniOscillator.getDefaults(), arguments, ["frequency", "type"]);
        this.frequency = new Signal({
            context: this.context,
            units: "frequency",
            value: options.frequency,
        });
        this.detune = new Signal({
            context: this.context,
            units: "cents",
            value: options.detune,
        });
        readOnly(this, ["frequency", "detune"]);
        // set the options
        this.set(options);
    }
    static getDefaults() {
        return Object.assign(Oscillator.getDefaults(), FMOscillator.getDefaults(), AMOscillator.getDefaults(), FatOscillator.getDefaults(), PulseOscillator.getDefaults(), PWMOscillator.getDefaults());
    }
    /**
     * start the oscillator
     */
    _start(time) {
        this._oscillator.start(time);
    }
    /**
     * start the oscillator
     */
    _stop(time) {
        this._oscillator.stop(time);
    }
    _restart(time) {
        this._oscillator.restart(time);
        return this;
    }
    /**
     * The type of the oscillator. Can be any of the basic types: sine, square, triangle, sawtooth. Or
     * prefix the basic types with "fm", "am", or "fat" to use the FMOscillator, AMOscillator or FatOscillator
     * types. The oscillator could also be set to "pwm" or "pulse". All of the parameters of the
     * oscillator's class are accessible when the oscillator is set to that type, but throws an error
     * when it's not.
     * @example
     * const omniOsc = new Tone.OmniOscillator().toDestination().start();
     * omniOsc.type = "pwm";
     * // modulationFrequency is parameter which is available
     * // only when the type is "pwm".
     * omniOsc.modulationFrequency.value = 0.5;
     */
    get type() {
        let prefix = "";
        if (["am", "fm", "fat"].some(p => this._sourceType === p)) {
            prefix = this._sourceType;
        }
        return prefix + this._oscillator.type;
    }
    set type(type) {
        if (type.substr(0, 2) === "fm") {
            this._createNewOscillator("fm");
            this._oscillator = this._oscillator;
            this._oscillator.type = type.substr(2);
        }
        else if (type.substr(0, 2) === "am") {
            this._createNewOscillator("am");
            this._oscillator = this._oscillator;
            this._oscillator.type = type.substr(2);
        }
        else if (type.substr(0, 3) === "fat") {
            this._createNewOscillator("fat");
            this._oscillator = this._oscillator;
            this._oscillator.type = type.substr(3);
        }
        else if (type === "pwm") {
            this._createNewOscillator("pwm");
            this._oscillator = this._oscillator;
        }
        else if (type === "pulse") {
            this._createNewOscillator("pulse");
        }
        else {
            this._createNewOscillator("oscillator");
            this._oscillator = this._oscillator;
            this._oscillator.type = type;
        }
    }
    /**
     * The value is an empty array when the type is not "custom".
     * This is not available on "pwm" and "pulse" oscillator types.
     * See [[Oscillator.partials]]
     */
    get partials() {
        return this._oscillator.partials;
    }
    set partials(partials) {
        if (!this._getOscType(this._oscillator, "pulse") && !this._getOscType(this._oscillator, "pwm")) {
            this._oscillator.partials = partials;
        }
    }
    get partialCount() {
        return this._oscillator.partialCount;
    }
    set partialCount(partialCount) {
        if (!this._getOscType(this._oscillator, "pulse") && !this._getOscType(this._oscillator, "pwm")) {
            this._oscillator.partialCount = partialCount;
        }
    }
    set(props) {
        // make sure the type is set first
        if (Reflect.has(props, "type") && props.type) {
            this.type = props.type;
        }
        // then set the rest
        super.set(props);
        return this;
    }
    /**
     * connect the oscillator to the frequency and detune signals
     */
    _createNewOscillator(oscType) {
        if (oscType !== this._sourceType) {
            this._sourceType = oscType;
            const OscConstructor = OmniOscillatorSourceMap[oscType];
            // short delay to avoid clicks on the change
            const now = this.now();
            if (this._oscillator) {
                const oldOsc = this._oscillator;
                oldOsc.stop(now);
                // dispose the old one
                this.context.setTimeout(() => oldOsc.dispose(), this.blockTime);
            }
            this._oscillator = new OscConstructor({
                context: this.context,
            });
            this.frequency.connect(this._oscillator.frequency);
            this.detune.connect(this._oscillator.detune);
            this._oscillator.connect(this.output);
            this._oscillator.onstop = () => this.onstop(this);
            if (this.state === "started") {
                this._oscillator.start(now);
            }
        }
    }
    get phase() {
        return this._oscillator.phase;
    }
    set phase(phase) {
        this._oscillator.phase = phase;
    }
    /**
     * The source type of the oscillator.
     * @example
     * const omniOsc = new Tone.OmniOscillator(440, "fmsquare");
     * console.log(omniOsc.sourceType); // 'fm'
     */
    get sourceType() {
        return this._sourceType;
    }
    set sourceType(sType) {
        // the basetype defaults to sine
        let baseType = "sine";
        if (this._oscillator.type !== "pwm" && this._oscillator.type !== "pulse") {
            baseType = this._oscillator.type;
        }
        // set the type
        if (sType === "fm") {
            this.type = "fm" + baseType;
        }
        else if (sType === "am") {
            this.type = "am" + baseType;
        }
        else if (sType === "fat") {
            this.type = "fat" + baseType;
        }
        else if (sType === "oscillator") {
            this.type = baseType;
        }
        else if (sType === "pulse") {
            this.type = "pulse";
        }
        else if (sType === "pwm") {
            this.type = "pwm";
        }
    }
    _getOscType(osc, sourceType) {
        return osc instanceof OmniOscillatorSourceMap[sourceType];
    }
    /**
     * The base type of the oscillator. See [[Oscillator.baseType]]
     * @example
     * const omniOsc = new Tone.OmniOscillator(440, "fmsquare4");
     * console.log(omniOsc.sourceType, omniOsc.baseType, omniOsc.partialCount);
     */
    get baseType() {
        return this._oscillator.baseType;
    }
    set baseType(baseType) {
        if (!this._getOscType(this._oscillator, "pulse") &&
            !this._getOscType(this._oscillator, "pwm") &&
            baseType !== "pulse" && baseType !== "pwm") {
            this._oscillator.baseType = baseType;
        }
    }
    /**
     * The width of the oscillator when sourceType === "pulse".
     * See [[PWMOscillator.width]]
     */
    get width() {
        if (this._getOscType(this._oscillator, "pulse")) {
            return this._oscillator.width;
        }
        else {
            return undefined;
        }
    }
    /**
     * The number of detuned oscillators when sourceType === "fat".
     * See [[FatOscillator.count]]
     */
    get count() {
        if (this._getOscType(this._oscillator, "fat")) {
            return this._oscillator.count;
        }
        else {
            return undefined;
        }
    }
    set count(count) {
        if (this._getOscType(this._oscillator, "fat") && isNumber(count)) {
            this._oscillator.count = count;
        }
    }
    /**
     * The detune spread between the oscillators when sourceType === "fat".
     * See [[FatOscillator.count]]
     */
    get spread() {
        if (this._getOscType(this._oscillator, "fat")) {
            return this._oscillator.spread;
        }
        else {
            return undefined;
        }
    }
    set spread(spread) {
        if (this._getOscType(this._oscillator, "fat") && isNumber(spread)) {
            this._oscillator.spread = spread;
        }
    }
    /**
     * The type of the modulator oscillator. Only if the oscillator is set to "am" or "fm" types.
     * See [[AMOscillator]] or [[FMOscillator]]
     */
    get modulationType() {
        if (this._getOscType(this._oscillator, "fm") || this._getOscType(this._oscillator, "am")) {
            return this._oscillator.modulationType;
        }
        else {
            return undefined;
        }
    }
    set modulationType(mType) {
        if ((this._getOscType(this._oscillator, "fm") || this._getOscType(this._oscillator, "am")) && isString(mType)) {
            this._oscillator.modulationType = mType;
        }
    }
    /**
     * The modulation index when the sourceType === "fm"
     * See [[FMOscillator]].
     */
    get modulationIndex() {
        if (this._getOscType(this._oscillator, "fm")) {
            return this._oscillator.modulationIndex;
        }
        else {
            return undefined;
        }
    }
    /**
     * Harmonicity is the frequency ratio between the carrier and the modulator oscillators.
     * See [[AMOscillator]] or [[FMOscillator]]
     */
    get harmonicity() {
        if (this._getOscType(this._oscillator, "fm") || this._getOscType(this._oscillator, "am")) {
            return this._oscillator.harmonicity;
        }
        else {
            return undefined;
        }
    }
    /**
     * The modulationFrequency Signal of the oscillator when sourceType === "pwm"
     * see [[PWMOscillator]]
     * @min 0.1
     * @max 5
     */
    get modulationFrequency() {
        if (this._getOscType(this._oscillator, "pwm")) {
            return this._oscillator.modulationFrequency;
        }
        else {
            return undefined;
        }
    }
    asArray(length = 1024) {
        return __awaiter(this, void 0, void 0, function* () {
            return generateWaveform(this, length);
        });
    }
    dispose() {
        super.dispose();
        this.detune.dispose();
        this.frequency.dispose();
        this._oscillator.dispose();
        return this;
    }
}

/**
 * Assert that the number is in the given range.
 */
function range(min, max = Infinity) {
    const valueMap = new WeakMap();
    return function (target, propertyKey) {
        Reflect.defineProperty(target, propertyKey, {
            configurable: true,
            enumerable: true,
            get: function () {
                return valueMap.get(this);
            },
            set: function (newValue) {
                assertRange(newValue, min, max);
                valueMap.set(this, newValue);
            }
        });
    };
}
/**
 * Convert the time to seconds and assert that the time is in between the two
 * values when being set.
 */
function timeRange(min, max = Infinity) {
    const valueMap = new WeakMap();
    return function (target, propertyKey) {
        Reflect.defineProperty(target, propertyKey, {
            configurable: true,
            enumerable: true,
            get: function () {
                return valueMap.get(this);
            },
            set: function (newValue) {
                assertRange(this.toSeconds(newValue), min, max);
                valueMap.set(this, newValue);
            }
        });
    };
}

/**
 * Player is an audio file player with start, loop, and stop functions.
 * @example
 * const player = new Tone.Player("https://tonejs.github.io/audio/berklee/gong_1.mp3").toDestination();
 * // play as soon as the buffer is loaded
 * player.autostart = true;
 * @category Source
 */
class Player extends Source {
    constructor() {
        super(optionsFromArguments(Player.getDefaults(), arguments, ["url", "onload"]));
        this.name = "Player";
        /**
         * All of the active buffer source nodes
         */
        this._activeSources = new Set();
        const options = optionsFromArguments(Player.getDefaults(), arguments, ["url", "onload"]);
        this._buffer = new ToneAudioBuffer({
            onload: this._onload.bind(this, options.onload),
            onerror: options.onerror,
            reverse: options.reverse,
            url: options.url,
        });
        this.autostart = options.autostart;
        this._loop = options.loop;
        this._loopStart = options.loopStart;
        this._loopEnd = options.loopEnd;
        this._playbackRate = options.playbackRate;
        this.fadeIn = options.fadeIn;
        this.fadeOut = options.fadeOut;
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            autostart: false,
            fadeIn: 0,
            fadeOut: 0,
            loop: false,
            loopEnd: 0,
            loopStart: 0,
            onload: noOp,
            onerror: noOp,
            playbackRate: 1,
            reverse: false,
        });
    }
    /**
     * Load the audio file as an audio buffer.
     * Decodes the audio asynchronously and invokes
     * the callback once the audio buffer loads.
     * Note: this does not need to be called if a url
     * was passed in to the constructor. Only use this
     * if you want to manually load a new url.
     * @param url The url of the buffer to load. Filetype support depends on the browser.
     */
    load(url) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._buffer.load(url);
            this._onload();
            return this;
        });
    }
    /**
     * Internal callback when the buffer is loaded.
     */
    _onload(callback = noOp) {
        callback();
        if (this.autostart) {
            this.start();
        }
    }
    /**
     * Internal callback when the buffer is done playing.
     */
    _onSourceEnd(source) {
        // invoke the onstop function
        this.onstop(this);
        // delete the source from the active sources
        this._activeSources.delete(source);
        if (this._activeSources.size === 0 && !this._synced &&
            this._state.getValueAtTime(this.now()) === "started") {
            // remove the 'implicitEnd' event and replace with an explicit end
            this._state.cancel(this.now());
            this._state.setStateAtTime("stopped", this.now());
        }
    }
    /**
     * Play the buffer at the given startTime. Optionally add an offset
     * and/or duration which will play the buffer from a position
     * within the buffer for the given duration.
     *
     * @param  time When the player should start.
     * @param  offset The offset from the beginning of the sample to start at.
     * @param  duration How long the sample should play. If no duration is given, it will default to the full length of the sample (minus any offset)
     */
    start(time, offset, duration) {
        super.start(time, offset, duration);
        return this;
    }
    /**
     * Internal start method
     */
    _start(startTime, offset, duration) {
        // if it's a loop the default offset is the loopStart point
        if (this._loop) {
            offset = defaultArg(offset, this._loopStart);
        }
        else {
            // otherwise the default offset is 0
            offset = defaultArg(offset, 0);
        }
        // compute the values in seconds
        const computedOffset = this.toSeconds(offset);
        // compute the duration which is either the passed in duration of the buffer.duration - offset
        const origDuration = duration;
        duration = defaultArg(duration, Math.max(this._buffer.duration - computedOffset, 0));
        let computedDuration = this.toSeconds(duration);
        // scale it by the playback rate
        computedDuration = computedDuration / this._playbackRate;
        // get the start time
        startTime = this.toSeconds(startTime);
        // make the source
        const source = new ToneBufferSource({
            url: this._buffer,
            context: this.context,
            fadeIn: this.fadeIn,
            fadeOut: this.fadeOut,
            loop: this._loop,
            loopEnd: this._loopEnd,
            loopStart: this._loopStart,
            onended: this._onSourceEnd.bind(this),
            playbackRate: this._playbackRate,
        }).connect(this.output);
        // set the looping properties
        if (!this._loop && !this._synced) {
            // cancel the previous stop
            this._state.cancel(startTime + computedDuration);
            // if it's not looping, set the state change at the end of the sample
            this._state.setStateAtTime("stopped", startTime + computedDuration, {
                implicitEnd: true,
            });
        }
        // add it to the array of active sources
        this._activeSources.add(source);
        // start it
        if (this._loop && isUndef(origDuration)) {
            source.start(startTime, computedOffset);
        }
        else {
            // subtract the fade out time
            source.start(startTime, computedOffset, computedDuration - this.toSeconds(this.fadeOut));
        }
    }
    /**
     * Stop playback.
     */
    _stop(time) {
        const computedTime = this.toSeconds(time);
        this._activeSources.forEach(source => source.stop(computedTime));
    }
    /**
     * Stop and then restart the player from the beginning (or offset)
     * @param  time When the player should start.
     * @param  offset The offset from the beginning of the sample to start at.
     * @param  duration How long the sample should play. If no duration is given,
     * 					it will default to the full length of the sample (minus any offset)
     */
    restart(time, offset, duration) {
        super.restart(time, offset, duration);
        return this;
    }
    _restart(time, offset, duration) {
        this._stop(time);
        this._start(time, offset, duration);
    }
    /**
     * Seek to a specific time in the player's buffer. If the
     * source is no longer playing at that time, it will stop.
     * @param offset The time to seek to.
     * @param when The time for the seek event to occur.
     * @example
     * const player = new Tone.Player("https://tonejs.github.io/audio/berklee/gurgling_theremin_1.mp3", () => {
     * 	player.start();
     * 	// seek to the offset in 1 second from now
     * 	player.seek(0.4, "+1");
     * }).toDestination();
     */
    seek(offset, when) {
        const computedTime = this.toSeconds(when);
        if (this._state.getValueAtTime(computedTime) === "started") {
            const computedOffset = this.toSeconds(offset);
            // if it's currently playing, stop it
            this._stop(computedTime);
            // restart it at the given time
            this._start(computedTime, computedOffset);
        }
        return this;
    }
    /**
     * Set the loop start and end. Will only loop if loop is set to true.
     * @param loopStart The loop start time
     * @param loopEnd The loop end time
     * @example
     * const player = new Tone.Player("https://tonejs.github.io/audio/berklee/malevoices_aa2_F3.mp3").toDestination();
     * // loop between the given points
     * player.setLoopPoints(0.2, 0.3);
     * player.loop = true;
     * player.autostart = true;
     */
    setLoopPoints(loopStart, loopEnd) {
        this.loopStart = loopStart;
        this.loopEnd = loopEnd;
        return this;
    }
    /**
     * If loop is true, the loop will start at this position.
     */
    get loopStart() {
        return this._loopStart;
    }
    set loopStart(loopStart) {
        this._loopStart = loopStart;
        if (this.buffer.loaded) {
            assertRange(this.toSeconds(loopStart), 0, this.buffer.duration);
        }
        // get the current source
        this._activeSources.forEach(source => {
            source.loopStart = loopStart;
        });
    }
    /**
     * If loop is true, the loop will end at this position.
     */
    get loopEnd() {
        return this._loopEnd;
    }
    set loopEnd(loopEnd) {
        this._loopEnd = loopEnd;
        if (this.buffer.loaded) {
            assertRange(this.toSeconds(loopEnd), 0, this.buffer.duration);
        }
        // get the current source
        this._activeSources.forEach(source => {
            source.loopEnd = loopEnd;
        });
    }
    /**
     * The audio buffer belonging to the player.
     */
    get buffer() {
        return this._buffer;
    }
    set buffer(buffer) {
        this._buffer.set(buffer);
    }
    /**
     * If the buffer should loop once it's over.
     * @example
     * const player = new Tone.Player("https://tonejs.github.io/audio/drum-samples/breakbeat.mp3").toDestination();
     * player.loop = true;
     * player.autostart = true;
     */
    get loop() {
        return this._loop;
    }
    set loop(loop) {
        // if no change, do nothing
        if (this._loop === loop) {
            return;
        }
        this._loop = loop;
        // set the loop of all of the sources
        this._activeSources.forEach(source => {
            source.loop = loop;
        });
        if (loop) {
            // remove the next stopEvent
            const stopEvent = this._state.getNextState("stopped", this.now());
            if (stopEvent) {
                this._state.cancel(stopEvent.time);
            }
        }
    }
    /**
     * Normal speed is 1. The pitch will change with the playback rate.
     * @example
     * const player = new Tone.Player("https://tonejs.github.io/audio/berklee/femalevoices_aa2_A5.mp3").toDestination();
     * // play at 1/4 speed
     * player.playbackRate = 0.25;
     * // play as soon as the buffer is loaded
     * player.autostart = true;
     */
    get playbackRate() {
        return this._playbackRate;
    }
    set playbackRate(rate) {
        this._playbackRate = rate;
        const now = this.now();
        // cancel the stop event since it's at a different time now
        const stopEvent = this._state.getNextState("stopped", now);
        if (stopEvent && stopEvent.implicitEnd) {
            this._state.cancel(stopEvent.time);
            this._activeSources.forEach(source => source.cancelStop());
        }
        // set all the sources
        this._activeSources.forEach(source => {
            source.playbackRate.setValueAtTime(rate, now);
        });
    }
    /**
     * If the buffer should be reversed
     * @example
     * const player = new Tone.Player("https://tonejs.github.io/audio/berklee/chime_1.mp3").toDestination();
     * player.autostart = true;
     * player.reverse = true;
     */
    get reverse() {
        return this._buffer.reverse;
    }
    set reverse(rev) {
        this._buffer.reverse = rev;
    }
    /**
     * If the buffer is loaded
     */
    get loaded() {
        return this._buffer.loaded;
    }
    dispose() {
        super.dispose();
        // disconnect all of the players
        this._activeSources.forEach(source => source.dispose());
        this._activeSources.clear();
        this._buffer.dispose();
        return this;
    }
}
__decorate([
    timeRange(0)
], Player.prototype, "fadeIn", void 0);
__decorate([
    timeRange(0)
], Player.prototype, "fadeOut", void 0);

/**
 * Envelope is an [ADSR](https://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope)
 * envelope generator. Envelope outputs a signal which
 * can be connected to an AudioParam or Tone.Signal.
 * ```
 *           /\
 *          /  \
 *         /    \
 *        /      \
 *       /        \___________
 *      /                     \
 *     /                       \
 *    /                         \
 *   /                           \
 * ```
 * @example
 * return Tone.Offline(() => {
 * 	const env = new Tone.Envelope({
 * 		attack: 0.1,
 * 		decay: 0.2,
 * 		sustain: 0.5,
 * 		release: 0.8,
 * 	}).toDestination();
 * 	env.triggerAttackRelease(0.5);
 * }, 1.5, 1);
 * @category Component
 */
class Envelope extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Envelope.getDefaults(), arguments, ["attack", "decay", "sustain", "release"]));
        this.name = "Envelope";
        /**
         * the signal which is output.
         */
        this._sig = new Signal({
            context: this.context,
            value: 0,
        });
        /**
         * The output signal of the envelope
         */
        this.output = this._sig;
        /**
         * Envelope has no input
         */
        this.input = undefined;
        const options = optionsFromArguments(Envelope.getDefaults(), arguments, ["attack", "decay", "sustain", "release"]);
        this.attack = options.attack;
        this.decay = options.decay;
        this.sustain = options.sustain;
        this.release = options.release;
        this.attackCurve = options.attackCurve;
        this.releaseCurve = options.releaseCurve;
        this.decayCurve = options.decayCurve;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            attack: 0.01,
            attackCurve: "linear",
            decay: 0.1,
            decayCurve: "exponential",
            release: 1,
            releaseCurve: "exponential",
            sustain: 0.5,
        });
    }
    /**
     * Read the current value of the envelope. Useful for
     * synchronizing visual output to the envelope.
     */
    get value() {
        return this.getValueAtTime(this.now());
    }
    /**
     * Get the curve
     * @param  curve
     * @param  direction  In/Out
     * @return The curve name
     */
    _getCurve(curve, direction) {
        if (isString(curve)) {
            return curve;
        }
        else {
            // look up the name in the curves array
            let curveName;
            for (curveName in EnvelopeCurves) {
                if (EnvelopeCurves[curveName][direction] === curve) {
                    return curveName;
                }
            }
            // return the custom curve
            return curve;
        }
    }
    /**
     * Assign a the curve to the given name using the direction
     * @param  name
     * @param  direction In/Out
     * @param  curve
     */
    _setCurve(name, direction, curve) {
        // check if it's a valid type
        if (isString(curve) && Reflect.has(EnvelopeCurves, curve)) {
            const curveDef = EnvelopeCurves[curve];
            if (isObject(curveDef)) {
                if (name !== "_decayCurve") {
                    this[name] = curveDef[direction];
                }
            }
            else {
                this[name] = curveDef;
            }
        }
        else if (isArray(curve) && name !== "_decayCurve") {
            this[name] = curve;
        }
        else {
            throw new Error("Envelope: invalid curve: " + curve);
        }
    }
    /**
     * The shape of the attack.
     * Can be any of these strings:
     * * "linear"
     * * "exponential"
     * * "sine"
     * * "cosine"
     * * "bounce"
     * * "ripple"
     * * "step"
     *
     * Can also be an array which describes the curve. Values
     * in the array are evenly subdivided and linearly
     * interpolated over the duration of the attack.
     * @example
     * return Tone.Offline(() => {
     * 	const env = new Tone.Envelope(0.4).toDestination();
     * 	env.attackCurve = "linear";
     * 	env.triggerAttack();
     * }, 1, 1);
     */
    get attackCurve() {
        return this._getCurve(this._attackCurve, "In");
    }
    set attackCurve(curve) {
        this._setCurve("_attackCurve", "In", curve);
    }
    /**
     * The shape of the release. See the attack curve types.
     * @example
     * return Tone.Offline(() => {
     * 	const env = new Tone.Envelope({
     * 		release: 0.8
     * 	}).toDestination();
     * 	env.triggerAttack();
     * 	// release curve could also be defined by an array
     * 	env.releaseCurve = [1, 0.3, 0.4, 0.2, 0.7, 0];
     * 	env.triggerRelease(0.2);
     * }, 1, 1);
     */
    get releaseCurve() {
        return this._getCurve(this._releaseCurve, "Out");
    }
    set releaseCurve(curve) {
        this._setCurve("_releaseCurve", "Out", curve);
    }
    /**
     * The shape of the decay either "linear" or "exponential"
     * @example
     * return Tone.Offline(() => {
     * 	const env = new Tone.Envelope({
     * 		sustain: 0.1,
     * 		decay: 0.5
     * 	}).toDestination();
     * 	env.decayCurve = "linear";
     * 	env.triggerAttack();
     * }, 1, 1);
     */
    get decayCurve() {
        return this._decayCurve;
    }
    set decayCurve(curve) {
        assert(["linear", "exponential"].some(c => c === curve), `Invalid envelope curve: ${curve}`);
        this._decayCurve = curve;
    }
    /**
     * Trigger the attack/decay portion of the ADSR envelope.
     * @param  time When the attack should start.
     * @param velocity The velocity of the envelope scales the vales.
     *                             number between 0-1
     * @example
     * const env = new Tone.AmplitudeEnvelope().toDestination();
     * const osc = new Tone.Oscillator().connect(env).start();
     * // trigger the attack 0.5 seconds from now with a velocity of 0.2
     * env.triggerAttack("+0.5", 0.2);
     */
    triggerAttack(time, velocity = 1) {
        this.log("triggerAttack", time, velocity);
        time = this.toSeconds(time);
        const originalAttack = this.toSeconds(this.attack);
        let attack = originalAttack;
        const decay = this.toSeconds(this.decay);
        // check if it's not a complete attack
        const currentValue = this.getValueAtTime(time);
        if (currentValue > 0) {
            // subtract the current value from the attack time
            const attackRate = 1 / attack;
            const remainingDistance = 1 - currentValue;
            // the attack is now the remaining time
            attack = remainingDistance / attackRate;
        }
        // attack
        if (attack < this.sampleTime) {
            this._sig.cancelScheduledValues(time);
            // case where the attack time is 0 should set instantly
            this._sig.setValueAtTime(velocity, time);
        }
        else if (this._attackCurve === "linear") {
            this._sig.linearRampTo(velocity, attack, time);
        }
        else if (this._attackCurve === "exponential") {
            this._sig.targetRampTo(velocity, attack, time);
        }
        else {
            this._sig.cancelAndHoldAtTime(time);
            let curve = this._attackCurve;
            // find the starting position in the curve
            for (let i = 1; i < curve.length; i++) {
                // the starting index is between the two values
                if (curve[i - 1] <= currentValue && currentValue <= curve[i]) {
                    curve = this._attackCurve.slice(i);
                    // the first index is the current value
                    curve[0] = currentValue;
                    break;
                }
            }
            this._sig.setValueCurveAtTime(curve, time, attack, velocity);
        }
        // decay
        if (decay && this.sustain < 1) {
            const decayValue = velocity * this.sustain;
            const decayStart = time + attack;
            this.log("decay", decayStart);
            if (this._decayCurve === "linear") {
                this._sig.linearRampToValueAtTime(decayValue, decay + decayStart);
            }
            else {
                this._sig.exponentialApproachValueAtTime(decayValue, decayStart, decay);
            }
        }
        return this;
    }
    /**
     * Triggers the release of the envelope.
     * @param  time When the release portion of the envelope should start.
     * @example
     * const env = new Tone.AmplitudeEnvelope().toDestination();
     * const osc = new Tone.Oscillator({
     * 	type: "sawtooth"
     * }).connect(env).start();
     * env.triggerAttack();
     * // trigger the release half a second after the attack
     * env.triggerRelease("+0.5");
     */
    triggerRelease(time) {
        this.log("triggerRelease", time);
        time = this.toSeconds(time);
        const currentValue = this.getValueAtTime(time);
        if (currentValue > 0) {
            const release = this.toSeconds(this.release);
            if (release < this.sampleTime) {
                this._sig.setValueAtTime(0, time);
            }
            else if (this._releaseCurve === "linear") {
                this._sig.linearRampTo(0, release, time);
            }
            else if (this._releaseCurve === "exponential") {
                this._sig.targetRampTo(0, release, time);
            }
            else {
                assert(isArray(this._releaseCurve), "releaseCurve must be either 'linear', 'exponential' or an array");
                this._sig.cancelAndHoldAtTime(time);
                this._sig.setValueCurveAtTime(this._releaseCurve, time, release, currentValue);
            }
        }
        return this;
    }
    /**
     * Get the scheduled value at the given time. This will
     * return the unconverted (raw) value.
     * @example
     * const env = new Tone.Envelope(0.5, 1, 0.4, 2);
     * env.triggerAttackRelease(2);
     * setInterval(() => console.log(env.getValueAtTime(Tone.now())), 100);
     */
    getValueAtTime(time) {
        return this._sig.getValueAtTime(time);
    }
    /**
     * triggerAttackRelease is shorthand for triggerAttack, then waiting
     * some duration, then triggerRelease.
     * @param duration The duration of the sustain.
     * @param time When the attack should be triggered.
     * @param velocity The velocity of the envelope.
     * @example
     * const env = new Tone.AmplitudeEnvelope().toDestination();
     * const osc = new Tone.Oscillator().connect(env).start();
     * // trigger the release 0.5 seconds after the attack
     * env.triggerAttackRelease(0.5);
     */
    triggerAttackRelease(duration, time, velocity = 1) {
        time = this.toSeconds(time);
        this.triggerAttack(time, velocity);
        this.triggerRelease(time + this.toSeconds(duration));
        return this;
    }
    /**
     * Cancels all scheduled envelope changes after the given time.
     */
    cancel(after) {
        this._sig.cancelScheduledValues(this.toSeconds(after));
        return this;
    }
    /**
     * Connect the envelope to a destination node.
     */
    connect(destination, outputNumber = 0, inputNumber = 0) {
        connectSignal(this, destination, outputNumber, inputNumber);
        return this;
    }
    /**
     * Render the envelope curve to an array of the given length.
     * Good for visualizing the envelope curve. Rescales the duration of the
     * envelope to fit the length.
     */
    asArray(length = 1024) {
        return __awaiter(this, void 0, void 0, function* () {
            const duration = length / this.context.sampleRate;
            const context = new OfflineContext(1, duration, this.context.sampleRate);
            // normalize the ADSR for the given duration with 20% sustain time
            const attackPortion = this.toSeconds(this.attack) + this.toSeconds(this.decay);
            const envelopeDuration = attackPortion + this.toSeconds(this.release);
            const sustainTime = envelopeDuration * 0.1;
            const totalDuration = envelopeDuration + sustainTime;
            // @ts-ignore
            const clone = new this.constructor(Object.assign(this.get(), {
                attack: duration * this.toSeconds(this.attack) / totalDuration,
                decay: duration * this.toSeconds(this.decay) / totalDuration,
                release: duration * this.toSeconds(this.release) / totalDuration,
                context
            }));
            clone._sig.toDestination();
            clone.triggerAttackRelease(duration * (attackPortion + sustainTime) / totalDuration, 0);
            const buffer = yield context.render();
            return buffer.getChannelData(0);
        });
    }
    dispose() {
        super.dispose();
        this._sig.dispose();
        return this;
    }
}
__decorate([
    timeRange(0)
], Envelope.prototype, "attack", void 0);
__decorate([
    timeRange(0)
], Envelope.prototype, "decay", void 0);
__decorate([
    range(0, 1)
], Envelope.prototype, "sustain", void 0);
__decorate([
    timeRange(0)
], Envelope.prototype, "release", void 0);
/**
 * Generate some complex envelope curves.
 */
const EnvelopeCurves = (() => {
    const curveLen = 128;
    let i;
    let k;
    // cosine curve
    const cosineCurve = [];
    for (i = 0; i < curveLen; i++) {
        cosineCurve[i] = Math.sin((i / (curveLen - 1)) * (Math.PI / 2));
    }
    // ripple curve
    const rippleCurve = [];
    const rippleCurveFreq = 6.4;
    for (i = 0; i < curveLen - 1; i++) {
        k = (i / (curveLen - 1));
        const sineWave = Math.sin(k * (Math.PI * 2) * rippleCurveFreq - Math.PI / 2) + 1;
        rippleCurve[i] = sineWave / 10 + k * 0.83;
    }
    rippleCurve[curveLen - 1] = 1;
    // stairs curve
    const stairsCurve = [];
    const steps = 5;
    for (i = 0; i < curveLen; i++) {
        stairsCurve[i] = Math.ceil((i / (curveLen - 1)) * steps) / steps;
    }
    // in-out easing curve
    const sineCurve = [];
    for (i = 0; i < curveLen; i++) {
        k = i / (curveLen - 1);
        sineCurve[i] = 0.5 * (1 - Math.cos(Math.PI * k));
    }
    // a bounce curve
    const bounceCurve = [];
    for (i = 0; i < curveLen; i++) {
        k = i / (curveLen - 1);
        const freq = Math.pow(k, 3) * 4 + 0.2;
        const val = Math.cos(freq * Math.PI * 2 * k);
        bounceCurve[i] = Math.abs(val * (1 - k));
    }
    /**
     * Invert a value curve to make it work for the release
     */
    function invertCurve(curve) {
        const out = new Array(curve.length);
        for (let j = 0; j < curve.length; j++) {
            out[j] = 1 - curve[j];
        }
        return out;
    }
    /**
     * reverse the curve
     */
    function reverseCurve(curve) {
        return curve.slice(0).reverse();
    }
    /**
     * attack and release curve arrays
     */
    return {
        bounce: {
            In: invertCurve(bounceCurve),
            Out: bounceCurve,
        },
        cosine: {
            In: cosineCurve,
            Out: reverseCurve(cosineCurve),
        },
        exponential: "exponential",
        linear: "linear",
        ripple: {
            In: rippleCurve,
            Out: invertCurve(rippleCurve),
        },
        sine: {
            In: sineCurve,
            Out: invertCurve(sineCurve),
        },
        step: {
            In: stairsCurve,
            Out: invertCurve(stairsCurve),
        },
    };
})();

/**
 * Base-class for all instruments
 */
class Instrument extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Instrument.getDefaults(), arguments));
        /**
         * Keep track of all events scheduled to the transport
         * when the instrument is 'synced'
         */
        this._scheduledEvents = [];
        /**
         * If the instrument is currently synced
         */
        this._synced = false;
        this._original_triggerAttack = this.triggerAttack;
        this._original_triggerRelease = this.triggerRelease;
        const options = optionsFromArguments(Instrument.getDefaults(), arguments);
        this._volume = this.output = new Volume({
            context: this.context,
            volume: options.volume,
        });
        this.volume = this._volume.volume;
        readOnly(this, "volume");
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            volume: 0,
        });
    }
    /**
     * Sync the instrument to the Transport. All subsequent calls of
     * [[triggerAttack]] and [[triggerRelease]] will be scheduled along the transport.
     * @example
     * const fmSynth = new Tone.FMSynth().toDestination();
     * fmSynth.volume.value = -6;
     * fmSynth.sync();
     * // schedule 3 notes when the transport first starts
     * fmSynth.triggerAttackRelease("C4", "8n", 0);
     * fmSynth.triggerAttackRelease("E4", "8n", "8n");
     * fmSynth.triggerAttackRelease("G4", "8n", "4n");
     * // start the transport to hear the notes
     * Tone.Transport.start();
     */
    sync() {
        if (this._syncState()) {
            this._syncMethod("triggerAttack", 1);
            this._syncMethod("triggerRelease", 0);
        }
        return this;
    }
    /**
     * set _sync
     */
    _syncState() {
        let changed = false;
        if (!this._synced) {
            this._synced = true;
            changed = true;
        }
        return changed;
    }
    /**
     * Wrap the given method so that it can be synchronized
     * @param method Which method to wrap and sync
     * @param  timePosition What position the time argument appears in
     */
    _syncMethod(method, timePosition) {
        const originalMethod = this["_original_" + method] = this[method];
        this[method] = (...args) => {
            const time = args[timePosition];
            const id = this.context.transport.schedule((t) => {
                args[timePosition] = t;
                originalMethod.apply(this, args);
            }, time);
            this._scheduledEvents.push(id);
        };
    }
    /**
     * Unsync the instrument from the Transport
     */
    unsync() {
        this._scheduledEvents.forEach(id => this.context.transport.clear(id));
        this._scheduledEvents = [];
        if (this._synced) {
            this._synced = false;
            this.triggerAttack = this._original_triggerAttack;
            this.triggerRelease = this._original_triggerRelease;
        }
        return this;
    }
    /**
     * Trigger the attack and then the release after the duration.
     * @param  note     The note to trigger.
     * @param  duration How long the note should be held for before
     *                         triggering the release. This value must be greater than 0.
     * @param time  When the note should be triggered.
     * @param  velocity The velocity the note should be triggered at.
     * @example
     * const synth = new Tone.Synth().toDestination();
     * // trigger "C4" for the duration of an 8th note
     * synth.triggerAttackRelease("C4", "8n");
     */
    triggerAttackRelease(note, duration, time, velocity) {
        const computedTime = this.toSeconds(time);
        const computedDuration = this.toSeconds(duration);
        this.triggerAttack(note, computedTime, velocity);
        this.triggerRelease(computedTime + computedDuration);
        return this;
    }
    /**
     * clean up
     * @returns {Instrument} this
     */
    dispose() {
        super.dispose();
        this._volume.dispose();
        this.unsync();
        this._scheduledEvents = [];
        return this;
    }
}

/**
 * Abstract base class for other monophonic instruments to extend.
 */
class Monophonic extends Instrument {
    constructor() {
        super(optionsFromArguments(Monophonic.getDefaults(), arguments));
        const options = optionsFromArguments(Monophonic.getDefaults(), arguments);
        this.portamento = options.portamento;
        this.onsilence = options.onsilence;
    }
    static getDefaults() {
        return Object.assign(Instrument.getDefaults(), {
            detune: 0,
            onsilence: noOp,
            portamento: 0,
        });
    }
    /**
     * Trigger the attack of the note optionally with a given velocity.
     * @param  note The note to trigger.
     * @param  time When the note should start.
     * @param  velocity The velocity scaler determines how "loud" the note will be triggered.
     * @example
     * const synth = new Tone.Synth().toDestination();
     * // trigger the note a half second from now at half velocity
     * synth.triggerAttack("C4", "+0.5", 0.5);
     */
    triggerAttack(note, time, velocity = 1) {
        this.log("triggerAttack", note, time, velocity);
        const seconds = this.toSeconds(time);
        this._triggerEnvelopeAttack(seconds, velocity);
        this.setNote(note, seconds);
        return this;
    }
    /**
     * Trigger the release portion of the envelope
     * @param  time If no time is given, the release happens immediatly
     * @example
     * const synth = new Tone.Synth().toDestination();
     * synth.triggerAttack("C4");
     * // trigger the release a second from now
     * synth.triggerRelease("+1");
     */
    triggerRelease(time) {
        this.log("triggerRelease", time);
        const seconds = this.toSeconds(time);
        this._triggerEnvelopeRelease(seconds);
        return this;
    }
    /**
     * Set the note at the given time. If no time is given, the note
     * will set immediately.
     * @param note The note to change to.
     * @param  time The time when the note should be set.
     * @example
     * const synth = new Tone.Synth().toDestination();
     * synth.triggerAttack("C4");
     * // change to F#6 in one quarter note from now.
     * synth.setNote("F#6", "+4n");
     */
    setNote(note, time) {
        const computedTime = this.toSeconds(time);
        const computedFrequency = note instanceof FrequencyClass ? note.toFrequency() : note;
        if (this.portamento > 0 && this.getLevelAtTime(computedTime) > 0.05) {
            const portTime = this.toSeconds(this.portamento);
            this.frequency.exponentialRampTo(computedFrequency, portTime, computedTime);
        }
        else {
            this.frequency.setValueAtTime(computedFrequency, computedTime);
        }
        return this;
    }
}
__decorate([
    timeRange(0)
], Monophonic.prototype, "portamento", void 0);

/**
 * AmplitudeEnvelope is a Tone.Envelope connected to a gain node.
 * Unlike Tone.Envelope, which outputs the envelope's value, AmplitudeEnvelope accepts
 * an audio signal as the input and will apply the envelope to the amplitude
 * of the signal.
 * Read more about ADSR Envelopes on [Wikipedia](https://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope).
 *
 * @example
 * return Tone.Offline(() => {
 * 	const ampEnv = new Tone.AmplitudeEnvelope({
 * 		attack: 0.1,
 * 		decay: 0.2,
 * 		sustain: 1.0,
 * 		release: 0.8
 * 	}).toDestination();
 * 	// create an oscillator and connect it
 * 	const osc = new Tone.Oscillator().connect(ampEnv).start();
 * 	// trigger the envelopes attack and release "8t" apart
 * 	ampEnv.triggerAttackRelease("8t");
 * }, 1.5, 1);
 * @category Component
 */
class AmplitudeEnvelope extends Envelope {
    constructor() {
        super(optionsFromArguments(AmplitudeEnvelope.getDefaults(), arguments, ["attack", "decay", "sustain", "release"]));
        this.name = "AmplitudeEnvelope";
        this._gainNode = new Gain({
            context: this.context,
            gain: 0,
        });
        this.output = this._gainNode;
        this.input = this._gainNode;
        this._sig.connect(this._gainNode.gain);
        this.output = this._gainNode;
        this.input = this._gainNode;
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this._gainNode.dispose();
        return this;
    }
}

/**
 * Synth is composed simply of a [[OmniOscillator]] routed through an [[AmplitudeEnvelope]].
 * ```
 * +----------------+   +-------------------+
 * | OmniOscillator +>--> AmplitudeEnvelope +>--> Output
 * +----------------+   +-------------------+
 * ```
 * @example
 * const synth = new Tone.Synth().toDestination();
 * synth.triggerAttackRelease("C4", "8n");
 * @category Instrument
 */
class Synth extends Monophonic {
    constructor() {
        super(optionsFromArguments(Synth.getDefaults(), arguments));
        this.name = "Synth";
        const options = optionsFromArguments(Synth.getDefaults(), arguments);
        this.oscillator = new OmniOscillator(Object.assign({
            context: this.context,
            detune: options.detune,
            onstop: () => this.onsilence(this),
        }, options.oscillator));
        this.frequency = this.oscillator.frequency;
        this.detune = this.oscillator.detune;
        this.envelope = new AmplitudeEnvelope(Object.assign({
            context: this.context,
        }, options.envelope));
        // connect the oscillators to the output
        this.oscillator.chain(this.envelope, this.output);
        readOnly(this, ["oscillator", "frequency", "detune", "envelope"]);
    }
    static getDefaults() {
        return Object.assign(Monophonic.getDefaults(), {
            envelope: Object.assign(omitFromObject(Envelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
                attack: 0.005,
                decay: 0.1,
                release: 1,
                sustain: 0.3,
            }),
            oscillator: Object.assign(omitFromObject(OmniOscillator.getDefaults(), [...Object.keys(Source.getDefaults()), "frequency", "detune"]), {
                type: "triangle",
            }),
        });
    }
    /**
     * start the attack portion of the envelope
     * @param time the time the attack should start
     * @param velocity the velocity of the note (0-1)
     */
    _triggerEnvelopeAttack(time, velocity) {
        // the envelopes
        this.envelope.triggerAttack(time, velocity);
        this.oscillator.start(time);
        // if there is no release portion, stop the oscillator
        if (this.envelope.sustain === 0) {
            const computedAttack = this.toSeconds(this.envelope.attack);
            const computedDecay = this.toSeconds(this.envelope.decay);
            this.oscillator.stop(time + computedAttack + computedDecay);
        }
    }
    /**
     * start the release portion of the envelope
     * @param time the time the release should start
     */
    _triggerEnvelopeRelease(time) {
        this.envelope.triggerRelease(time);
        this.oscillator.stop(time + this.toSeconds(this.envelope.release));
    }
    getLevelAtTime(time) {
        time = this.toSeconds(time);
        return this.envelope.getValueAtTime(time);
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this.oscillator.dispose();
        this.envelope.dispose();
        return this;
    }
}

/**
 * MembraneSynth makes kick and tom sounds using a single oscillator
 * with an amplitude envelope and frequency ramp. A Tone.OmniOscillator
 * is routed through a Tone.AmplitudeEnvelope to the output. The drum
 * quality of the sound comes from the frequency envelope applied
 * during MembraneSynth.triggerAttack(note). The frequency envelope
 * starts at <code>note * .octaves</code> and ramps to <code>note</code>
 * over the duration of <code>.pitchDecay</code>.
 * @example
 * const synth = new Tone.MembraneSynth().toDestination();
 * synth.triggerAttackRelease("C2", "8n");
 * @category Instrument
 */
class MembraneSynth extends Synth {
    constructor() {
        super(optionsFromArguments(MembraneSynth.getDefaults(), arguments));
        this.name = "MembraneSynth";
        /**
         * Portamento is ignored in this synth. use pitch decay instead.
         */
        this.portamento = 0;
        const options = optionsFromArguments(MembraneSynth.getDefaults(), arguments);
        this.pitchDecay = options.pitchDecay;
        this.octaves = options.octaves;
        readOnly(this, ["oscillator", "envelope"]);
    }
    static getDefaults() {
        return deepMerge(Monophonic.getDefaults(), Synth.getDefaults(), {
            envelope: {
                attack: 0.001,
                attackCurve: "exponential",
                decay: 0.4,
                release: 1.4,
                sustain: 0.01,
            },
            octaves: 10,
            oscillator: {
                type: "sine",
            },
            pitchDecay: 0.05,
        });
    }
    setNote(note, time) {
        const seconds = this.toSeconds(time);
        const hertz = this.toFrequency(note instanceof FrequencyClass ? note.toFrequency() : note);
        const maxNote = hertz * this.octaves;
        this.oscillator.frequency.setValueAtTime(maxNote, seconds);
        this.oscillator.frequency.exponentialRampToValueAtTime(hertz, seconds + this.toSeconds(this.pitchDecay));
        return this;
    }
    dispose() {
        super.dispose();
        return this;
    }
}
__decorate([
    range(0)
], MembraneSynth.prototype, "octaves", void 0);
__decorate([
    timeRange(0)
], MembraneSynth.prototype, "pitchDecay", void 0);

/**
 * All of the classes or functions which are loaded into the AudioWorkletGlobalScope
 */
const workletContext = new Set();
/**
 * Add a class to the AudioWorkletGlobalScope
 */
function addToWorklet(classOrFunction) {
    workletContext.add(classOrFunction);
}
/**
 * Register a processor in the AudioWorkletGlobalScope with the given name
 */
function registerProcessor(name, classDesc) {
    const processor = /* javascript */ `registerProcessor("${name}", ${classDesc})`;
    workletContext.add(processor);
}
/**
 * Get all of the modules which have been registered to the AudioWorkletGlobalScope
 */
function getWorkletGlobalScope() {
    return Array.from(workletContext).join("\n");
}

const toneAudioWorkletProcessor = /* javascript */ `
	/**
	 * The base AudioWorkletProcessor for use in Tone.js. Works with the [[ToneAudioWorklet]]. 
	 */
	class ToneAudioWorkletProcessor extends AudioWorkletProcessor {

		constructor(options) {
			
			super(options);
			/**
			 * If the processor was disposed or not. Keep alive until it's disposed.
			 */
			this.disposed = false;
		   	/** 
			 * The number of samples in the processing block
			 */
			this.blockSize = 128;
			/**
			 * the sample rate
			 */
			this.sampleRate = sampleRate;

			this.port.onmessage = (event) => {
				// when it receives a dispose 
				if (event.data === "dispose") {
					this.disposed = true;
				}
			};
		}
	}
`;
addToWorklet(toneAudioWorkletProcessor);

const singleIOProcess = /* javascript */ `
	/**
	 * Abstract class for a single input/output processor. 
	 * has a 'generate' function which processes one sample at a time
	 */
	class SingleIOProcessor extends ToneAudioWorkletProcessor {

		constructor(options) {
			super(Object.assign(options, {
				numberOfInputs: 1,
				numberOfOutputs: 1
			}));
			/**
			 * Holds the name of the parameter and a single value of that
			 * parameter at the current sample
			 * @type { [name: string]: number }
			 */
			this.params = {}
		}

		/**
		 * Generate an output sample from the input sample and parameters
		 * @abstract
		 * @param input number
		 * @param channel number
		 * @param parameters { [name: string]: number }
		 * @returns number
		 */
		generate(){}

		/**
		 * Update the private params object with the 
		 * values of the parameters at the given index
		 * @param parameters { [name: string]: Float32Array },
		 * @param index number
		 */
		updateParams(parameters, index) {
			for (const paramName in parameters) {
				const param = parameters[paramName];
				if (param.length > 1) {
					this.params[paramName] = parameters[paramName][index];
				} else {
					this.params[paramName] = parameters[paramName][0];
				}
			}
		}

		/**
		 * Process a single frame of the audio
		 * @param inputs Float32Array[][]
		 * @param outputs Float32Array[][]
		 */
		process(inputs, outputs, parameters) {
			const input = inputs[0];
			const output = outputs[0];
			// get the parameter values
			const channelCount = Math.max(input && input.length || 0, output.length);
			for (let sample = 0; sample < this.blockSize; sample++) {
				this.updateParams(parameters, sample);
				for (let channel = 0; channel < channelCount; channel++) {
					const inputSample = input && input.length ? input[channel][sample] : 0;
					output[channel][sample] = this.generate(inputSample, channel, this.params);
				}
			}
			return !this.disposed;
		}
	};
`;
addToWorklet(singleIOProcess);

const delayLine = /* javascript */ `
	/**
	 * A multichannel buffer for use within an AudioWorkletProcessor as a delay line
	 */
	class DelayLine {
		
		constructor(size, channels) {
			this.buffer = [];
			this.writeHead = []
			this.size = size;

			// create the empty channels
			for (let i = 0; i < channels; i++) {
				this.buffer[i] = new Float32Array(this.size);
				this.writeHead[i] = 0;
			}
		}

		/**
		 * Push a value onto the end
		 * @param channel number
		 * @param value number
		 */
		push(channel, value) {
			this.writeHead[channel] += 1;
			if (this.writeHead[channel] > this.size) {
				this.writeHead[channel] = 0;
			}
			this.buffer[channel][this.writeHead[channel]] = value;
		}

		/**
		 * Get the recorded value of the channel given the delay
		 * @param channel number
		 * @param delay number delay samples
		 */
		get(channel, delay) {
			let readHead = this.writeHead[channel] - Math.floor(delay);
			if (readHead < 0) {
				readHead += this.size;
			}
			return this.buffer[channel][readHead];
		}
	}
`;
addToWorklet(delayLine);

const workletName = "feedback-comb-filter";
const feedbackCombFilter = /* javascript */ `
	class FeedbackCombFilterWorklet extends SingleIOProcessor {

		constructor(options) {
			super(options);
			this.delayLine = new DelayLine(this.sampleRate, options.channelCount || 2);
		}

		static get parameterDescriptors() {
			return [{
				name: "delayTime",
				defaultValue: 0.1,
				minValue: 0,
				maxValue: 1,
				automationRate: "k-rate"
			}, {
				name: "feedback",
				defaultValue: 0.5,
				minValue: 0,
				maxValue: 0.9999,
				automationRate: "k-rate"
			}];
		}

		generate(input, channel, parameters) {
			const delayedSample = this.delayLine.get(channel, parameters.delayTime * this.sampleRate);
			this.delayLine.push(channel, input + delayedSample * parameters.feedback);
			return delayedSample;
		}
	}
`;
registerProcessor(workletName, feedbackCombFilter);

/**
 * Pass in an object which maps the note's pitch or midi value to the url,
 * then you can trigger the attack and release of that note like other instruments.
 * By automatically repitching the samples, it is possible to play pitches which
 * were not explicitly included which can save loading time.
 *
 * For sample or buffer playback where repitching is not necessary,
 * use [[Player]].
 * @example
 * const sampler = new Tone.Sampler({
 * 	urls: {
 * 		A1: "A1.mp3",
 * 		A2: "A2.mp3",
 * 	},
 * 	baseUrl: "https://tonejs.github.io/audio/casio/",
 * 	onload: () => {
 * 		sampler.triggerAttackRelease(["C1", "E1", "G1", "B1"], 0.5);
 * 	}
 * }).toDestination();
 * @category Instrument
 */
class Sampler extends Instrument {
    constructor() {
        super(optionsFromArguments(Sampler.getDefaults(), arguments, ["urls", "onload", "baseUrl"], "urls"));
        this.name = "Sampler";
        /**
         * The object of all currently playing BufferSources
         */
        this._activeSources = new Map();
        const options = optionsFromArguments(Sampler.getDefaults(), arguments, ["urls", "onload", "baseUrl"], "urls");
        const urlMap = {};
        Object.keys(options.urls).forEach((note) => {
            const noteNumber = parseInt(note, 10);
            assert(isNote(note)
                || (isNumber(noteNumber) && isFinite(noteNumber)), `url key is neither a note or midi pitch: ${note}`);
            if (isNote(note)) {
                // convert the note name to MIDI
                const mid = new FrequencyClass(this.context, note).toMidi();
                urlMap[mid] = options.urls[note];
            }
            else if (isNumber(noteNumber) && isFinite(noteNumber)) {
                // otherwise if it's numbers assume it's midi
                urlMap[noteNumber] = options.urls[noteNumber];
            }
        });
        this._buffers = new ToneAudioBuffers({
            urls: urlMap,
            onload: options.onload,
            baseUrl: options.baseUrl,
            onerror: options.onerror,
        });
        this.attack = options.attack;
        this.release = options.release;
        this.curve = options.curve;
        // invoke the callback if it's already loaded
        if (this._buffers.loaded) {
            // invoke onload deferred
            Promise.resolve().then(options.onload);
        }
    }
    static getDefaults() {
        return Object.assign(Instrument.getDefaults(), {
            attack: 0,
            baseUrl: "",
            curve: "exponential",
            onload: noOp,
            onerror: noOp,
            release: 0.1,
            urls: {},
        });
    }
    /**
     * Returns the difference in steps between the given midi note at the closets sample.
     */
    _findClosest(midi) {
        // searches within 8 octaves of the given midi note
        const MAX_INTERVAL = 96;
        let interval = 0;
        while (interval < MAX_INTERVAL) {
            // check above and below
            if (this._buffers.has(midi + interval)) {
                return -interval;
            }
            else if (this._buffers.has(midi - interval)) {
                return interval;
            }
            interval++;
        }
        throw new Error(`No available buffers for note: ${midi}`);
    }
    /**
     * @param  notes	The note to play, or an array of notes.
     * @param  time     When to play the note
     * @param  velocity The velocity to play the sample back.
     */
    triggerAttack(notes, time, velocity = 1) {
        this.log("triggerAttack", notes, time, velocity);
        if (!Array.isArray(notes)) {
            notes = [notes];
        }
        notes.forEach(note => {
            const midiFloat = ftomf(new FrequencyClass(this.context, note).toFrequency());
            const midi = Math.round(midiFloat);
            const remainder = midiFloat - midi;
            // find the closest note pitch
            const difference = this._findClosest(midi);
            const closestNote = midi - difference;
            const buffer = this._buffers.get(closestNote);
            const playbackRate = intervalToFrequencyRatio(difference + remainder);
            // play that note
            const source = new ToneBufferSource({
                url: buffer,
                context: this.context,
                curve: this.curve,
                fadeIn: this.attack,
                fadeOut: this.release,
                playbackRate,
            }).connect(this.output);
            source.start(time, 0, buffer.duration / playbackRate, velocity);
            // add it to the active sources
            if (!isArray(this._activeSources.get(midi))) {
                this._activeSources.set(midi, []);
            }
            this._activeSources.get(midi).push(source);
            // remove it when it's done
            source.onended = () => {
                if (this._activeSources && this._activeSources.has(midi)) {
                    const sources = this._activeSources.get(midi);
                    const index = sources.indexOf(source);
                    if (index !== -1) {
                        sources.splice(index, 1);
                    }
                }
            };
        });
        return this;
    }
    /**
     * @param  notes	The note to release, or an array of notes.
     * @param  time     	When to release the note.
     */
    triggerRelease(notes, time) {
        this.log("triggerRelease", notes, time);
        if (!Array.isArray(notes)) {
            notes = [notes];
        }
        notes.forEach(note => {
            const midi = new FrequencyClass(this.context, note).toMidi();
            // find the note
            if (this._activeSources.has(midi) && this._activeSources.get(midi).length) {
                const sources = this._activeSources.get(midi);
                time = this.toSeconds(time);
                sources.forEach(source => {
                    source.stop(time);
                });
                this._activeSources.set(midi, []);
            }
        });
        return this;
    }
    /**
     * Release all currently active notes.
     * @param  time     	When to release the notes.
     */
    releaseAll(time) {
        const computedTime = this.toSeconds(time);
        this._activeSources.forEach(sources => {
            while (sources.length) {
                const source = sources.shift();
                source.stop(computedTime);
            }
        });
        return this;
    }
    sync() {
        if (this._syncState()) {
            this._syncMethod("triggerAttack", 1);
            this._syncMethod("triggerRelease", 1);
        }
        return this;
    }
    /**
     * Invoke the attack phase, then after the duration, invoke the release.
     * @param  notes	The note to play and release, or an array of notes.
     * @param  duration The time the note should be held
     * @param  time     When to start the attack
     * @param  velocity The velocity of the attack
     */
    triggerAttackRelease(notes, duration, time, velocity = 1) {
        const computedTime = this.toSeconds(time);
        this.triggerAttack(notes, computedTime, velocity);
        if (isArray(duration)) {
            assert(isArray(notes), "notes must be an array when duration is array");
            notes.forEach((note, index) => {
                const d = duration[Math.min(index, duration.length - 1)];
                this.triggerRelease(note, computedTime + this.toSeconds(d));
            });
        }
        else {
            this.triggerRelease(notes, computedTime + this.toSeconds(duration));
        }
        return this;
    }
    /**
     * Add a note to the sampler.
     * @param  note      The buffer's pitch.
     * @param  url  Either the url of the buffer, or a buffer which will be added with the given name.
     * @param  callback  The callback to invoke when the url is loaded.
     */
    add(note, url, callback) {
        assert(isNote(note) || isFinite(note), `note must be a pitch or midi: ${note}`);
        if (isNote(note)) {
            // convert the note name to MIDI
            const mid = new FrequencyClass(this.context, note).toMidi();
            this._buffers.add(mid, url, callback);
        }
        else {
            // otherwise if it's numbers assume it's midi
            this._buffers.add(note, url, callback);
        }
        return this;
    }
    /**
     * If the buffers are loaded or not
     */
    get loaded() {
        return this._buffers.loaded;
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this._buffers.dispose();
        this._activeSources.forEach(sources => {
            sources.forEach(source => source.dispose());
        });
        this._activeSources.clear();
        return this;
    }
}
__decorate([
    timeRange(0)
], Sampler.prototype, "attack", void 0);
__decorate([
    timeRange(0)
], Sampler.prototype, "release", void 0);

/**
 * Panner is an equal power Left/Right Panner. It is a wrapper around the StereoPannerNode.
 * @example
 * return Tone.Offline(() => {
 * // move the input signal from right to left
 * 	const panner = new Tone.Panner(1).toDestination();
 * 	panner.pan.rampTo(-1, 0.5);
 * 	const osc = new Tone.Oscillator(100).connect(panner).start();
 * }, 0.5, 2);
 * @category Component
 */
class Panner extends ToneAudioNode {
    constructor() {
        super(Object.assign(optionsFromArguments(Panner.getDefaults(), arguments, ["pan"])));
        this.name = "Panner";
        /**
         * the panner node
         */
        this._panner = this.context.createStereoPanner();
        this.input = this._panner;
        this.output = this._panner;
        const options = optionsFromArguments(Panner.getDefaults(), arguments, ["pan"]);
        this.pan = new Param({
            context: this.context,
            param: this._panner.pan,
            value: options.pan,
            minValue: -1,
            maxValue: 1,
        });
        // this is necessary for standardized-audio-context
        // doesn't make any difference for the native AudioContext
        // https://github.com/chrisguttandin/standardized-audio-context/issues/647
        this._panner.channelCount = options.channelCount;
        this._panner.channelCountMode = "explicit";
        // initial value
        readOnly(this, "pan");
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            pan: 0,
            channelCount: 1,
        });
    }
    dispose() {
        super.dispose();
        this._panner.disconnect();
        this.pan.dispose();
        return this;
    }
}

const workletName$1 = "bit-crusher";
const bitCrusherWorklet = /* javascript */ `
	class BitCrusherWorklet extends SingleIOProcessor {

		static get parameterDescriptors() {
			return [{
				name: "bits",
				defaultValue: 12,
				minValue: 1,
				maxValue: 16,
				automationRate: 'k-rate'
			}];
		}

		generate(input, _channel, parameters) {
			const step = Math.pow(0.5, parameters.bits - 1);
			const val = step * Math.floor(input / step + 0.5);
			return val;
		}
	}
`;
registerProcessor(workletName$1, bitCrusherWorklet);

/**
 * Solo lets you isolate a specific audio stream. When an instance is set to `solo=true`,
 * it will mute all other instances of Solo.
 * @example
 * const soloA = new Tone.Solo().toDestination();
 * const oscA = new Tone.Oscillator("C4", "sawtooth").connect(soloA);
 * const soloB = new Tone.Solo().toDestination();
 * const oscB = new Tone.Oscillator("E4", "square").connect(soloB);
 * soloA.solo = true;
 * // no audio will pass through soloB
 * @category Component
 */
class Solo extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Solo.getDefaults(), arguments, ["solo"]));
        this.name = "Solo";
        const options = optionsFromArguments(Solo.getDefaults(), arguments, ["solo"]);
        this.input = this.output = new Gain({
            context: this.context,
        });
        if (!Solo._allSolos.has(this.context)) {
            Solo._allSolos.set(this.context, new Set());
        }
        Solo._allSolos.get(this.context).add(this);
        // set initially
        this.solo = options.solo;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            solo: false,
        });
    }
    /**
     * Isolates this instance and mutes all other instances of Solo.
     * Only one instance can be soloed at a time. A soloed
     * instance will report `solo=false` when another instance is soloed.
     */
    get solo() {
        return this._isSoloed();
    }
    set solo(solo) {
        if (solo) {
            this._addSolo();
        }
        else {
            this._removeSolo();
        }
        Solo._allSolos.get(this.context).forEach(instance => instance._updateSolo());
    }
    /**
     * If the current instance is muted, i.e. another instance is soloed
     */
    get muted() {
        return this.input.gain.value === 0;
    }
    /**
     * Add this to the soloed array
     */
    _addSolo() {
        if (!Solo._soloed.has(this.context)) {
            Solo._soloed.set(this.context, new Set());
        }
        Solo._soloed.get(this.context).add(this);
    }
    /**
     * Remove this from the soloed array
     */
    _removeSolo() {
        if (Solo._soloed.has(this.context)) {
            Solo._soloed.get(this.context).delete(this);
        }
    }
    /**
     * Is this on the soloed array
     */
    _isSoloed() {
        return Solo._soloed.has(this.context) && Solo._soloed.get(this.context).has(this);
    }
    /**
     * Returns true if no one is soloed
     */
    _noSolos() {
        // either does not have any soloed added
        return !Solo._soloed.has(this.context) ||
            // or has a solo set but doesn't include any items
            (Solo._soloed.has(this.context) && Solo._soloed.get(this.context).size === 0);
    }
    /**
     * Solo the current instance and unsolo all other instances.
     */
    _updateSolo() {
        if (this._isSoloed()) {
            this.input.gain.value = 1;
        }
        else if (this._noSolos()) {
            // no one is soloed
            this.input.gain.value = 1;
        }
        else {
            this.input.gain.value = 0;
        }
    }
    dispose() {
        super.dispose();
        Solo._allSolos.get(this.context).delete(this);
        this._removeSolo();
        return this;
    }
}
/**
 * Hold all of the solo'ed tracks belonging to a specific context
 */
Solo._allSolos = new Map();
/**
 * Hold the currently solo'ed instance(s)
 */
Solo._soloed = new Map();

/**
 * PanVol is a Tone.Panner and Tone.Volume in one.
 * @example
 * // pan the incoming signal left and drop the volume
 * const panVol = new Tone.PanVol(-0.25, -12).toDestination();
 * const osc = new Tone.Oscillator().connect(panVol).start();
 * @category Component
 */
class PanVol extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(PanVol.getDefaults(), arguments, ["pan", "volume"]));
        this.name = "PanVol";
        const options = optionsFromArguments(PanVol.getDefaults(), arguments, ["pan", "volume"]);
        this._panner = this.input = new Panner({
            context: this.context,
            pan: options.pan,
            channelCount: options.channelCount,
        });
        this.pan = this._panner.pan;
        this._volume = this.output = new Volume({
            context: this.context,
            volume: options.volume,
        });
        this.volume = this._volume.volume;
        // connections
        this._panner.connect(this._volume);
        this.mute = options.mute;
        readOnly(this, ["pan", "volume"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            mute: false,
            pan: 0,
            volume: 0,
            channelCount: 1,
        });
    }
    /**
     * Mute/unmute the volume
     */
    get mute() {
        return this._volume.mute;
    }
    set mute(mute) {
        this._volume.mute = mute;
    }
    dispose() {
        super.dispose();
        this._panner.dispose();
        this.pan.dispose();
        this._volume.dispose();
        this.volume.dispose();
        return this;
    }
}

/**
 * Channel provides a channel strip interface with volume, pan, solo and mute controls.
 * See [[PanVol]] and [[Solo]]
 * @example
 * // pan the incoming signal left and drop the volume 12db
 * const channel = new Tone.Channel(-0.25, -12);
 * @category Component
 */
class Channel extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Channel.getDefaults(), arguments, ["volume", "pan"]));
        this.name = "Channel";
        const options = optionsFromArguments(Channel.getDefaults(), arguments, ["volume", "pan"]);
        this._solo = this.input = new Solo({
            solo: options.solo,
            context: this.context,
        });
        this._panVol = this.output = new PanVol({
            context: this.context,
            pan: options.pan,
            volume: options.volume,
            mute: options.mute,
            channelCount: options.channelCount
        });
        this.pan = this._panVol.pan;
        this.volume = this._panVol.volume;
        this._solo.connect(this._panVol);
        readOnly(this, ["pan", "volume"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            pan: 0,
            volume: 0,
            mute: false,
            solo: false,
            channelCount: 1,
        });
    }
    /**
     * Solo/unsolo the channel. Soloing is only relative to other [[Channels]] and [[Solo]] instances
     */
    get solo() {
        return this._solo.solo;
    }
    set solo(solo) {
        this._solo.solo = solo;
    }
    /**
     * If the current instance is muted, i.e. another instance is soloed,
     * or the channel is muted
     */
    get muted() {
        return this._solo.muted || this.mute;
    }
    /**
     * Mute/unmute the volume
     */
    get mute() {
        return this._panVol.mute;
    }
    set mute(mute) {
        this._panVol.mute = mute;
    }
    /**
     * Get the gain node belonging to the bus name. Create it if
     * it doesn't exist
     * @param name The bus name
     */
    _getBus(name) {
        if (!Channel.buses.has(name)) {
            Channel.buses.set(name, new Gain({ context: this.context }));
        }
        return Channel.buses.get(name);
    }
    /**
     * Send audio to another channel using a string. `send` is a lot like
     * [[connect]], except it uses a string instead of an object. This can
     * be useful in large applications to decouple sections since [[send]]
     * and [[receive]] can be invoked separately in order to connect an object
     * @param name The channel name to send the audio
     * @param volume The amount of the signal to send.
     * 	Defaults to 0db, i.e. send the entire signal
     * @returns Returns the gain node of this connection.
     */
    send(name, volume = 0) {
        const bus = this._getBus(name);
        const sendKnob = new Gain({
            context: this.context,
            units: "decibels",
            gain: volume,
        });
        this.connect(sendKnob);
        sendKnob.connect(bus);
        return sendKnob;
    }
    /**
     * Receive audio from a channel which was connected with [[send]].
     * @param name The channel name to receive audio from.
     */
    receive(name) {
        const bus = this._getBus(name);
        bus.connect(this);
        return this;
    }
    dispose() {
        super.dispose();
        this._panVol.dispose();
        this.pan.dispose();
        this.volume.dispose();
        this._solo.dispose();
        return this;
    }
}
/**
 * Store the send/receive channels by name.
 */
Channel.buses = new Map();

/**
 * Tone.Listener is a thin wrapper around the AudioListener. Listener combined
 * with [[Panner3D]] makes up the Web Audio API's 3D panning system. Panner3D allows you
 * to place sounds in 3D and Listener allows you to navigate the 3D sound environment from
 * a first-person perspective. There is only one listener per audio context.
 */
class Listener extends ToneAudioNode {
    constructor() {
        super(...arguments);
        this.name = "Listener";
        this.positionX = new Param({
            context: this.context,
            param: this.context.rawContext.listener.positionX,
        });
        this.positionY = new Param({
            context: this.context,
            param: this.context.rawContext.listener.positionY,
        });
        this.positionZ = new Param({
            context: this.context,
            param: this.context.rawContext.listener.positionZ,
        });
        this.forwardX = new Param({
            context: this.context,
            param: this.context.rawContext.listener.forwardX,
        });
        this.forwardY = new Param({
            context: this.context,
            param: this.context.rawContext.listener.forwardY,
        });
        this.forwardZ = new Param({
            context: this.context,
            param: this.context.rawContext.listener.forwardZ,
        });
        this.upX = new Param({
            context: this.context,
            param: this.context.rawContext.listener.upX,
        });
        this.upY = new Param({
            context: this.context,
            param: this.context.rawContext.listener.upY,
        });
        this.upZ = new Param({
            context: this.context,
            param: this.context.rawContext.listener.upZ,
        });
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            forwardX: 0,
            forwardY: 0,
            forwardZ: -1,
            upX: 0,
            upY: 1,
            upZ: 0,
        });
    }
    dispose() {
        super.dispose();
        this.positionX.dispose();
        this.positionY.dispose();
        this.positionZ.dispose();
        this.forwardX.dispose();
        this.forwardY.dispose();
        this.forwardZ.dispose();
        this.upX.dispose();
        this.upY.dispose();
        this.upZ.dispose();
        return this;
    }
}
//-------------------------------------
// 	INITIALIZATION
//-------------------------------------
onContextInit(context => {
    context.listener = new Listener({ context });
});
onContextClose(context => {
    context.listener.dispose();
});

/**
 * The current audio context time of the global [[Context]].
 * See [[Context.now]]
 * @category Core
 */
function now() {
    return getContext().now();
}
/**
 * The current audio context time of the global [[Context]] without the [[Context.lookAhead]]
 * See [[Context.immediate]]
 * @category Core
 */
function immediate() {
    return getContext().immediate();
}
/**
 * The Transport object belonging to the global Tone.js Context.
 * See [[Transport]]
 * @category Core
 */
const Transport$1 = getContext().transport;
/**
 * The Transport object belonging to the global Tone.js Context.
 * See [[Transport]]
 * @category Core
 */
function getTransport() {
    return getContext().transport;
}
/**
 * The Destination (output) belonging to the global Tone.js Context.
 * See [[Destination]]
 * @category Core
 */
const Destination$1 = getContext().destination;
/**
 * @deprecated Use [[Destination]]
 */
const Master = getContext().destination;
/**
 * The Destination (output) belonging to the global Tone.js Context.
 * See [[Destination]]
 * @category Core
 */
function getDestination() {
    return getContext().destination;
}
/**
 * The [[Listener]] belonging to the global Tone.js Context.
 * @category Core
 */
const Listener$1 = getContext().listener;
/**
 * The [[Listener]] belonging to the global Tone.js Context.
 * @category Core
 */
function getListener() {
    return getContext().listener;
}
/**
 * Draw is used to synchronize the draw frame with the Transport's callbacks.
 * See [[Draw]]
 * @category Core
 */
const Draw$1 = getContext().draw;
/**
 * Get the singleton attached to the global context.
 * Draw is used to synchronize the draw frame with the Transport's callbacks.
 * See [[Draw]]
 * @category Core
 */
function getDraw() {
    return getContext().draw;
}
/**
 * A reference to the global context
 * See [[Context]]
 */
const context = getContext();
/**
 * Promise which resolves when all of the loading promises are resolved.
 * Alias for static [[ToneAudioBuffer.loaded]] method.
 * @category Core
 */
function loaded() {
    return ToneAudioBuffer.loaded();
}
const Buffer = ToneAudioBuffer;
const Buffers = ToneAudioBuffers;
const BufferSource = ToneBufferSource;

export { isArray as $, AudioToGain as A, TransportTimeClass as B, Clock as C, Monophonic as D, Synth as E, Frequency as F, Gain as G, omitFromObject as H, OmniOscillator as I, Envelope as J, writable as K, AmplitudeEnvelope as L, Midi as M, deepMerge as N, OfflineContext as O, Param as P, FMOscillator as Q, Instrument as R, Sampler as S, ToneAudioNode as T, getWorkletGlobalScope as U, Volume as V, WaveShaper as W, workletName as X, warn as Y, MidiClass as Z, __awaiter as _, ToneAudioBuffers as a, ToneWithContext as a0, StateTimeline as a1, TicksClass as a2, isBoolean as a3, isObject as a4, isUndef as a5, clamp as a6, Panner as a7, gainToDb as a8, dbToGain as a9, Context as aA, BaseContext as aB, FrequencyClass as aC, TimeClass as aD, Time as aE, Ticks as aF, TransportTime as aG, Emitter as aH, IntervalTimeline as aI, Timeline as aJ, isFunction as aK, AMOscillator as aL, PulseOscillator as aM, FatOscillator as aN, PWMOscillator as aO, Channel as aP, PanVol as aQ, Solo as aR, version as aS, workletName$1 as aa, ToneOscillatorNode as ab, theWindow as ac, isNote as ad, MembraneSynth as ae, getDestination as af, now as ag, immediate as ah, Transport$1 as ai, getTransport as aj, Destination$1 as ak, Master as al, Listener$1 as am, getListener as an, Draw$1 as ao, getDraw as ap, context as aq, loaded as ar, Buffer as as, Buffers as at, BufferSource as au, start as av, isSupported as aw, Debug as ax, ftom as ay, mtof as az, ToneBufferSource as b, ToneAudioBuffer as c, Source as d, assert as e, isNumber as f, getContext as g, isDefined as h, isString as i, connect as j, Signal as k, connectSeries as l, SignalOperator as m, Multiply as n, optionsFromArguments as o, disconnect as p, Oscillator as q, readOnly as r, setContext as s, connectSignal as t, noOp as u, Player as v, intervalToFrequencyRatio as w, assertRange as x, defaultArg as y, ToneConstantSource as z };
