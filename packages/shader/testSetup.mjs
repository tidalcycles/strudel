// Fix `ReferenceError: self is not defined`
// when importing picogl in tests
globalThis.self = {};
