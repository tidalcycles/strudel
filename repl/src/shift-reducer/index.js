/*
 * Copyright 2018 Shape Security, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export { reduce, reduce as default } from './director.js';
export { thunkedReduce } from './thunked-director.js';
export { default as thunkify } from './thunkify.js';
export { default as thunkifyClass } from './thunkify-class.js';
export { default as memoize } from './memoize.js';
export { default as CloneReducer } from './clone-reducer.js';
export { default as LazyCloneReducer } from './lazy-clone-reducer.js';
export { default as MonoidalReducer } from './monoidal-reducer.js';
export { default as ThunkedMonoidalReducer } from './thunked-monoidal-reducer.js';
export { default as adapt } from './adapt.js';
export { PlusReducer, ThunkedPlusReducer, ConcatReducer, ThunkedConcatReducer, AndReducer, ThunkedAndReducer, OrReducer, ThunkedOrReducer } from './reducers.js';
