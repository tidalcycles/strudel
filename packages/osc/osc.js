(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.OSC = factory());
})(this, (function () { 'use strict';

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      enumerableOnly && (symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })), keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {};
      i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }

    return target;
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }

    return _assertThisInitialized(self);
  }

  function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();

    return function _createSuperInternal() {
      var Super = _getPrototypeOf(Derived),
          result;

      if (hasNativeReflectConstruct) {
        var NewTarget = _getPrototypeOf(this).constructor;

        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }

      return _possibleConstructorReturn(this, result);
    };
  }

  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }

    return object;
  }

  function _get() {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get;
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);

        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);

        if (desc.get) {
          return desc.get.call(arguments.length < 3 ? target : receiver);
        }

        return desc.value;
      };
    }

    return _get.apply(this, arguments);
  }

  function isInt(n) {
    return Number(n) === n && n % 1 === 0;
  }
  function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
  }
  function isNumber(n) {
    return Number(n) === n;
  }
  function isString(n) {
    return typeof n === 'string';
  }
  function isBoolean(n) {
    return typeof n === 'boolean';
  }
  function isInfinity(n) {
    return n === Infinity;
  }
  function isArray(n) {
    return Object.prototype.toString.call(n) === '[object Array]';
  }
  function isObject(n) {
    return Object.prototype.toString.call(n) === '[object Object]';
  }
  function isFunction(n) {
    return typeof n === 'function';
  }
  function isBlob(n) {
    return n instanceof Uint8Array;
  }
  function isDate(n) {
    return n instanceof Date;
  }
  function isUndefined(n) {
    return typeof n === 'undefined';
  }
  function isNull(n) {
    return n === null;
  }
  function pad(n) {
    return n + 3 & ~0x03;
  }
  function hasProperty(name) {
    return Object.prototype.hasOwnProperty.call(typeof global !== 'undefined' ? global : window,
    name);
  }
  function dataView(obj) {
    if (obj.buffer) {
      return new DataView(obj.buffer);
    } else if (obj instanceof ArrayBuffer) {
      return new DataView(obj);
    }
    return new DataView(new Uint8Array(obj));
  }

  function typeTag(item) {
    if (isInt(item)) {
      return 'i';
    } else if (isFloat(item)) {
      return 'f';
    } else if (isString(item)) {
      return 's';
    } else if (isBlob(item)) {
      return 'b';
    } else if (isBoolean(item)) {
      return item ? 'T' : 'F';
    } else if (isNull(item)) {
      return 'N';
    } else if (isInfinity(item)) {
      return 'I';
    }
    throw new Error('OSC typeTag() found unknown value type');
  }
  function prepareAddress(obj) {
    var address = '';
    if (isArray(obj)) {
      return "/".concat(obj.join('/'));
    } else if (isString(obj)) {
      address = obj;
      if (address.length > 1 && address[address.length - 1] === '/') {
        address = address.slice(0, address.length - 1);
      }
      if (address.length > 1 && address[0] !== '/') {
        address = "/".concat(address);
      }
      return address;
    }
    throw new Error('OSC prepareAddress() needs addresses of type array or string');
  }
  function prepareRegExPattern(str) {
    var pattern;
    if (!isString(str)) {
      throw new Error('OSC prepareRegExPattern() needs strings');
    }
    pattern = str.replace(/\./g, '\\.');
    pattern = pattern.replace(/\(/g, '\\(');
    pattern = pattern.replace(/\)/g, '\\)');
    pattern = pattern.replace(/\{/g, '(');
    pattern = pattern.replace(/\}/g, ')');
    pattern = pattern.replace(/,/g, '|');
    pattern = pattern.replace(/\[!/g, '[^');
    pattern = pattern.replace(/\?/g, '.');
    pattern = pattern.replace(/\*/g, '.*');
    return pattern;
  }
  var EncodeHelper = function () {
    function EncodeHelper() {
      _classCallCheck(this, EncodeHelper);
      this.data = [];
      this.byteLength = 0;
    }
    _createClass(EncodeHelper, [{
      key: "add",
      value: function add(item) {
        if (isBoolean(item) || isInfinity(item) || isNull(item)) {
          return this;
        }
        var buffer = item.pack();
        this.byteLength += buffer.byteLength;
        this.data.push(buffer);
        return this;
      }
    }, {
      key: "merge",
      value: function merge() {
        var result = new Uint8Array(this.byteLength);
        var offset = 0;
        this.data.forEach(function (data) {
          result.set(data, offset);
          offset += data.byteLength;
        });
        return result;
      }
    }]);
    return EncodeHelper;
  }();

  var Atomic = function () {
    function Atomic(value) {
      _classCallCheck(this, Atomic);
      this.value = value;
      this.offset = 0;
    }
    _createClass(Atomic, [{
      key: "pack",
      value: function pack(method, byteLength) {
        if (!(method && byteLength)) {
          throw new Error('OSC Atomic cant\'t be packed without given method or byteLength');
        }
        var data = new Uint8Array(byteLength);
        var dataView = new DataView(data.buffer);
        if (isUndefined(this.value)) {
          throw new Error('OSC Atomic cant\'t be encoded with empty value');
        }
        dataView[method](this.offset, this.value, false);
        return data;
      }
    }, {
      key: "unpack",
      value: function unpack(dataView, method, byteLength) {
        var initialOffset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
        if (!(dataView && method && byteLength)) {
          throw new Error('OSC Atomic cant\'t be unpacked without given dataView, method or byteLength');
        }
        if (!(dataView instanceof DataView)) {
          throw new Error('OSC Atomic expects an instance of type DataView');
        }
        this.value = dataView[method](initialOffset, false);
        this.offset = initialOffset + byteLength;
        return this.offset;
      }
    }]);
    return Atomic;
  }();

  var AtomicInt32 = function (_Atomic) {
    _inherits(AtomicInt32, _Atomic);
    var _super = _createSuper(AtomicInt32);
    function AtomicInt32(value) {
      _classCallCheck(this, AtomicInt32);
      if (value && !isInt(value)) {
        throw new Error('OSC AtomicInt32 constructor expects value of type number');
      }
      return _super.call(this, value);
    }
    _createClass(AtomicInt32, [{
      key: "pack",
      value: function pack() {
        return _get(_getPrototypeOf(AtomicInt32.prototype), "pack", this).call(this, 'setInt32', 4);
      }
    }, {
      key: "unpack",
      value: function unpack(dataView) {
        var initialOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        return _get(_getPrototypeOf(AtomicInt32.prototype), "unpack", this).call(this, dataView, 'getInt32', 4, initialOffset);
      }
    }]);
    return AtomicInt32;
  }(Atomic);

  var STR_SLICE_SIZE = 65537;
  var STR_ENCODING = 'utf-8';
  function charCodesToString(charCodes) {
    if (hasProperty('Buffer')) {
      return Buffer.from(charCodes).toString(STR_ENCODING);
    } else if (hasProperty('TextDecoder')) {
      return new TextDecoder(STR_ENCODING)
      .decode(new Int8Array(charCodes));
    }
    var str = '';
    for (var i = 0; i < charCodes.length; i += STR_SLICE_SIZE) {
      str += String.fromCharCode.apply(null, charCodes.slice(i, i + STR_SLICE_SIZE));
    }
    return str;
  }
  var AtomicString = function (_Atomic) {
    _inherits(AtomicString, _Atomic);
    var _super = _createSuper(AtomicString);
    function AtomicString(value) {
      _classCallCheck(this, AtomicString);
      if (value && !isString(value)) {
        throw new Error('OSC AtomicString constructor expects value of type string');
      }
      return _super.call(this, value);
    }
    _createClass(AtomicString, [{
      key: "pack",
      value: function pack() {
        if (isUndefined(this.value)) {
          throw new Error('OSC AtomicString can not be encoded with empty value');
        }
        var terminated = "".concat(this.value, "\0");
        var byteLength = pad(terminated.length);
        var buffer = new Uint8Array(byteLength);
        for (var i = 0; i < terminated.length; i += 1) {
          buffer[i] = terminated.charCodeAt(i);
        }
        return buffer;
      }
    }, {
      key: "unpack",
      value: function unpack(dataView) {
        var initialOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        if (!(dataView instanceof DataView)) {
          throw new Error('OSC AtomicString expects an instance of type DataView');
        }
        var offset = initialOffset;
        var charcode;
        var charCodes = [];
        for (; offset < dataView.byteLength; offset += 1) {
          charcode = dataView.getUint8(offset);
          if (charcode !== 0) {
            charCodes.push(charcode);
          } else {
            offset += 1;
            break;
          }
        }
        if (offset === dataView.length) {
          throw new Error('OSC AtomicString found a malformed OSC string');
        }
        this.offset = pad(offset);
        this.value = charCodesToString(charCodes);
        return this.offset;
      }
    }]);
    return AtomicString;
  }(Atomic);

  var SECONDS_70_YEARS = 2208988800;
  var TWO_POWER_32 = 4294967296;
  var Timetag = function () {
    function Timetag() {
      var seconds = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var fractions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      _classCallCheck(this, Timetag);
      if (!(isInt(seconds) && isInt(fractions))) {
        throw new Error('OSC Timetag constructor expects values of type integer number');
      }
      this.seconds = seconds;
      this.fractions = fractions;
    }
    _createClass(Timetag, [{
      key: "timestamp",
      value: function timestamp(milliseconds) {
        var seconds;
        if (typeof milliseconds === 'number') {
          seconds = milliseconds / 1000;
          var rounded = Math.floor(seconds);
          this.seconds = rounded + SECONDS_70_YEARS;
          this.fractions = Math.round(TWO_POWER_32 * (seconds - rounded));
          return milliseconds;
        }
        seconds = this.seconds - SECONDS_70_YEARS;
        return (seconds + Math.round(this.fractions / TWO_POWER_32)) * 1000;
      }
    }]);
    return Timetag;
  }();
  var AtomicTimetag = function (_Atomic) {
    _inherits(AtomicTimetag, _Atomic);
    var _super = _createSuper(AtomicTimetag);
    function AtomicTimetag() {
      var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Date.now();
      _classCallCheck(this, AtomicTimetag);
      var timetag = new Timetag();
      if (value instanceof Timetag) {
        timetag = value;
      } else if (isInt(value)) {
        timetag.timestamp(value);
      } else if (isDate(value)) {
        timetag.timestamp(value.getTime());
      }
      return _super.call(this, timetag);
    }
    _createClass(AtomicTimetag, [{
      key: "pack",
      value: function pack() {
        if (isUndefined(this.value)) {
          throw new Error('OSC AtomicTimetag can not be encoded with empty value');
        }
        var _this$value = this.value,
            seconds = _this$value.seconds,
            fractions = _this$value.fractions;
        var data = new Uint8Array(8);
        var dataView = new DataView(data.buffer);
        dataView.setInt32(0, seconds, false);
        dataView.setInt32(4, fractions, false);
        return data;
      }
    }, {
      key: "unpack",
      value: function unpack(dataView) {
        var initialOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        if (!(dataView instanceof DataView)) {
          throw new Error('OSC AtomicTimetag expects an instance of type DataView');
        }
        var seconds = dataView.getUint32(initialOffset, false);
        var fractions = dataView.getUint32(initialOffset + 4, false);
        this.value = new Timetag(seconds, fractions);
        this.offset = initialOffset + 8;
        return this.offset;
      }
    }]);
    return AtomicTimetag;
  }(Atomic);

  var AtomicBlob = function (_Atomic) {
    _inherits(AtomicBlob, _Atomic);
    var _super = _createSuper(AtomicBlob);
    function AtomicBlob(value) {
      _classCallCheck(this, AtomicBlob);
      if (value && !isBlob(value)) {
        throw new Error('OSC AtomicBlob constructor expects value of type Uint8Array');
      }
      return _super.call(this, value);
    }
    _createClass(AtomicBlob, [{
      key: "pack",
      value: function pack() {
        if (isUndefined(this.value)) {
          throw new Error('OSC AtomicBlob can not be encoded with empty value');
        }
        var byteLength = pad(this.value.byteLength);
        var data = new Uint8Array(byteLength + 4);
        var dataView = new DataView(data.buffer);
        dataView.setInt32(0, this.value.byteLength, false);
        data.set(this.value, 4);
        return data;
      }
    }, {
      key: "unpack",
      value: function unpack(dataView) {
        var initialOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        if (!(dataView instanceof DataView)) {
          throw new Error('OSC AtomicBlob expects an instance of type DataView');
        }
        var byteLength = dataView.getInt32(initialOffset, false);
        this.value = new Uint8Array(dataView.buffer, initialOffset + 4, byteLength);
        this.offset = pad(initialOffset + 4 + byteLength);
        return this.offset;
      }
    }]);
    return AtomicBlob;
  }(Atomic);

  var AtomicFloat32 = function (_Atomic) {
    _inherits(AtomicFloat32, _Atomic);
    var _super = _createSuper(AtomicFloat32);
    function AtomicFloat32(value) {
      _classCallCheck(this, AtomicFloat32);
      if (value && !isNumber(value)) {
        throw new Error('OSC AtomicFloat32 constructor expects value of type float');
      }
      return _super.call(this, value);
    }
    _createClass(AtomicFloat32, [{
      key: "pack",
      value: function pack() {
        return _get(_getPrototypeOf(AtomicFloat32.prototype), "pack", this).call(this, 'setFloat32', 4);
      }
    }, {
      key: "unpack",
      value: function unpack(dataView) {
        var initialOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        return _get(_getPrototypeOf(AtomicFloat32.prototype), "unpack", this).call(this, dataView, 'getFloat32', 4, initialOffset);
      }
    }]);
    return AtomicFloat32;
  }(Atomic);

  var AtomicFloat64 = function (_Atomic) {
    _inherits(AtomicFloat64, _Atomic);
    var _super = _createSuper(AtomicFloat64);
    function AtomicFloat64(value) {
      _classCallCheck(this, AtomicFloat64);
      if (value && !isNumber(value)) {
        throw new Error('OSC AtomicFloat64 constructor expects value of type float');
      }
      return _super.call(this, value);
    }
    _createClass(AtomicFloat64, [{
      key: "pack",
      value: function pack() {
        return _get(_getPrototypeOf(AtomicFloat64.prototype), "pack", this).call(this, 'setFloat64', 8);
      }
    }, {
      key: "unpack",
      value: function unpack(dataView) {
        var initialOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        return _get(_getPrototypeOf(AtomicFloat64.prototype), "unpack", this).call(this, dataView, 'getFloat64', 8, initialOffset);
      }
    }]);
    return AtomicFloat64;
  }(Atomic);

  var MAX_INT64 = BigInt('9223372036854775807');
  var MIN_INT64 = BigInt('-9223372036854775808');
  var AtomicInt64 = function (_Atomic) {
    _inherits(AtomicInt64, _Atomic);
    var _super = _createSuper(AtomicInt64);
    function AtomicInt64(value) {
      _classCallCheck(this, AtomicInt64);
      if (value && typeof value !== 'bigint') {
        throw new Error('OSC AtomicInt64 constructor expects value of type BigInt');
      }
      if (value && (value < MIN_INT64 || value > MAX_INT64)) {
        throw new Error('OSC AtomicInt64 value is out of bounds');
      }
      var tmp;
      if (value) {
        tmp = BigInt.asIntN(64, value);
      }
      return _super.call(this, tmp);
    }
    _createClass(AtomicInt64, [{
      key: "pack",
      value: function pack() {
        return _get(_getPrototypeOf(AtomicInt64.prototype), "pack", this).call(this, 'setBigInt64', 8);
      }
    }, {
      key: "unpack",
      value: function unpack(dataView) {
        var initialOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        return _get(_getPrototypeOf(AtomicInt64.prototype), "unpack", this).call(this, dataView, 'getBigInt64', 8, initialOffset);
      }
    }]);
    return AtomicInt64;
  }(Atomic);

  var MAX_UINT64 = BigInt('18446744073709551615');
  var AtomicUInt64 = function (_Atomic) {
    _inherits(AtomicUInt64, _Atomic);
    var _super = _createSuper(AtomicUInt64);
    function AtomicUInt64(value) {
      _classCallCheck(this, AtomicUInt64);
      if (value && typeof value !== 'bigint') {
        throw new Error('OSC AtomicUInt64 constructor expects value of type BigInt');
      }
      if (value && (value < 0 || value > MAX_UINT64)) {
        throw new Error('OSC AtomicUInt64 value is out of bounds');
      }
      var tmp;
      if (value) {
        tmp = BigInt.asUintN(64, value);
      }
      return _super.call(this, tmp);
    }
    _createClass(AtomicUInt64, [{
      key: "pack",
      value: function pack() {
        return _get(_getPrototypeOf(AtomicUInt64.prototype), "pack", this).call(this, 'setBigUint64', 8);
      }
    }, {
      key: "unpack",
      value: function unpack(dataView) {
        var initialOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        return _get(_getPrototypeOf(AtomicUInt64.prototype), "unpack", this).call(this, dataView, 'getBigUint64', 8, initialOffset);
      }
    }]);
    return AtomicUInt64;
  }(Atomic);

  var VALUE_TRUE = true;
  var VALUE_FALSE = false;
  var VALUE_NONE = null;
  var VALUE_INFINITY = Infinity;

  var TypedMessage = function () {
    function TypedMessage(address, args) {
      var _this = this;
      _classCallCheck(this, TypedMessage);
      this.offset = 0;
      this.address = '';
      this.types = '';
      this.args = [];
      if (!isUndefined(address)) {
        if (!(isString(address) || isArray(address))) {
          throw new Error('OSC Message constructor first argument (address) must be a string or array');
        }
        this.address = prepareAddress(address);
      }
      if (!isUndefined(args)) {
        if (!isArray(args)) {
          throw new Error('OSC Message constructor second argument (args) must be an array');
        }
        args.forEach(function (item) {
          return _this.add(item.type, item.value);
        });
      }
    }
    _createClass(TypedMessage, [{
      key: "add",
      value: function add(type, item) {
        if (isUndefined(type)) {
          throw new Error('OSC Message needs a valid OSC Atomic Data Type');
        }
        if (type === 'N') {
          this.args.push(VALUE_NONE);
        } else if (type === 'T') {
          this.args.push(VALUE_TRUE);
        } else if (type === 'F') {
          this.args.push(VALUE_FALSE);
        } else if (type === 'I') {
          this.args.push(VALUE_INFINITY);
        } else {
          this.args.push(item);
        }
        this.types += type;
      }
    }, {
      key: "pack",
      value: function pack() {
        var _this2 = this;
        if (this.address.length === 0 || this.address[0] !== '/') {
          throw new Error('OSC Message has an invalid address');
        }
        var encoder = new EncodeHelper();
        encoder.add(new AtomicString(this.address));
        encoder.add(new AtomicString(",".concat(this.types)));
        if (this.args.length > 0) {
          var argument;
          if (this.args.length > this.types.length) {
            throw new Error('OSC Message argument and type tag mismatch');
          }
          this.args.forEach(function (value, index) {
            var type = _this2.types[index];
            if (type === 'i') {
              argument = new AtomicInt32(value);
            } else if (type === 'h') {
              argument = new AtomicInt64(value);
            } else if (type === 't') {
              argument = new AtomicUInt64(value);
            } else if (type === 'f') {
              argument = new AtomicFloat32(value);
            } else if (type === 'd') {
              argument = new AtomicFloat64(value);
            } else if (type === 's') {
              argument = new AtomicString(value);
            } else if (type === 'b') {
              argument = new AtomicBlob(value);
            } else if (type === 'T') {
              argument = VALUE_TRUE;
            } else if (type === 'F') {
              argument = VALUE_FALSE;
            } else if (type === 'N') {
              argument = VALUE_NONE;
            } else if (type === 'I') {
              argument = VALUE_INFINITY;
            } else {
              throw new Error('OSC Message found unknown argument type');
            }
            encoder.add(argument);
          });
        }
        return encoder.merge();
      }
    }, {
      key: "unpack",
      value: function unpack(dataView) {
        var initialOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        if (!(dataView instanceof DataView)) {
          throw new Error('OSC Message expects an instance of type DataView.');
        }
        var address = new AtomicString();
        address.unpack(dataView, initialOffset);
        var types = new AtomicString();
        types.unpack(dataView, address.offset);
        if (address.value.length === 0 || address.value[0] !== '/') {
          throw new Error('OSC Message found malformed or missing address string');
        }
        if (types.value.length === 0 && types.value[0] !== ',') {
          throw new Error('OSC Message found malformed or missing type string');
        }
        var offset = types.offset;
        var next;
        var type;
        var args = [];
        for (var i = 1; i < types.value.length; i += 1) {
          type = types.value[i];
          next = null;
          if (type === 'i') {
            next = new AtomicInt32();
          } else if (type === 'h') {
            next = new AtomicInt64();
          } else if (type === 't') {
            next = new AtomicUInt64();
          } else if (type === 'f') {
            next = new AtomicFloat32();
          } else if (type === 'd') {
            next = new AtomicFloat64();
          } else if (type === 's') {
            next = new AtomicString();
          } else if (type === 'b') {
            next = new AtomicBlob();
          } else if (type === 'T') {
            args.push(VALUE_TRUE);
          } else if (type === 'F') {
            args.push(VALUE_FALSE);
          } else if (type === 'N') {
            args.push(VALUE_NONE);
          } else if (type === 'I') {
            args.push(VALUE_INFINITY);
          } else {
            throw new Error('OSC Message found unsupported argument type');
          }
          if (next) {
            offset = next.unpack(dataView, offset);
            args.push(next.value);
          }
        }
        this.offset = offset;
        this.address = address.value;
        this.types = types.value;
        this.args = args;
        return this.offset;
      }
    }]);
    return TypedMessage;
  }();
  var Message = function (_TypedMessage) {
    _inherits(Message, _TypedMessage);
    var _super = _createSuper(Message);
    function Message() {
      var _this3;
      _classCallCheck(this, Message);
      var address;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      if (args.length > 0) {
        address = args.shift();
      }
      var oscArgs;
      if (args.length > 0) {
        if (args[0] instanceof Array) {
          oscArgs = args.shift();
        }
      }
      _this3 = _super.call(this, address, oscArgs);
      if (args.length > 0) {
        _this3.types = args.map(function (item) {
          return typeTag(item);
        }).join('');
        _this3.args = args;
      }
      return _this3;
    }
    _createClass(Message, [{
      key: "add",
      value: function add(item) {
        _get(_getPrototypeOf(Message.prototype), "add", this).call(this, typeTag(item), item);
      }
    }]);
    return Message;
  }(TypedMessage);

  var BUNDLE_TAG = '#bundle';
  var Bundle = function () {
    function Bundle() {
      var _this = this;
      _classCallCheck(this, Bundle);
      this.offset = 0;
      this.timetag = new AtomicTimetag();
      this.bundleElements = [];
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      if (args.length > 0) {
        if (args[0] instanceof Date || isInt(args[0])) {
          this.timetag = new AtomicTimetag(args[0]);
        } else if (isArray(args[0])) {
          args[0].forEach(function (item) {
            _this.add(item);
          });
          if (args.length > 1 && (args[1] instanceof Date || isInt(args[0]))) {
            this.timetag = new AtomicTimetag(args[1]);
          }
        } else {
          args.forEach(function (item) {
            _this.add(item);
          });
        }
      }
    }
    _createClass(Bundle, [{
      key: "timestamp",
      value: function timestamp(ms) {
        if (!isInt(ms)) {
          throw new Error('OSC Bundle needs an integer for setting the timestamp');
        }
        this.timetag = new AtomicTimetag(ms);
      }
    }, {
      key: "add",
      value: function add(item) {
        if (!(item instanceof Message || item instanceof Bundle)) {
          throw new Error('OSC Bundle contains only Messages and Bundles');
        }
        this.bundleElements.push(item);
      }
    }, {
      key: "pack",
      value: function pack() {
        var encoder = new EncodeHelper();
        encoder.add(new AtomicString(BUNDLE_TAG));
        if (!this.timetag) {
          this.timetag = new AtomicTimetag();
        }
        encoder.add(this.timetag);
        this.bundleElements.forEach(function (item) {
          encoder.add(new AtomicInt32(item.pack().byteLength));
          encoder.add(item);
        });
        return encoder.merge();
      }
    }, {
      key: "unpack",
      value: function unpack(dataView) {
        var initialOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        if (!(dataView instanceof DataView)) {
          throw new Error('OSC Bundle expects an instance of type DataView');
        }
        var parentHead = new AtomicString();
        parentHead.unpack(dataView, initialOffset);
        if (parentHead.value !== BUNDLE_TAG) {
          throw new Error('OSC Bundle does not contain a valid #bundle head');
        }
        var timetag = new AtomicTimetag();
        var offset = timetag.unpack(dataView, parentHead.offset);
        this.bundleElements = [];
        while (offset < dataView.byteLength) {
          var head = new AtomicString();
          var size = new AtomicInt32();
          offset = size.unpack(dataView, offset);
          var item = void 0;
          head.unpack(dataView, offset);
          if (head.value === BUNDLE_TAG) {
            item = new Bundle();
          } else {
            item = new Message();
          }
          offset = item.unpack(dataView, offset);
          this.bundleElements.push(item);
        }
        this.offset = offset;
        this.timetag = timetag;
        return this.offset;
      }
    }]);
    return Bundle;
  }();

  var Packet = function () {
    function Packet(value) {
      _classCallCheck(this, Packet);
      if (value && !(value instanceof Message || value instanceof Bundle)) {
        throw new Error('OSC Packet value has to be Message or Bundle');
      }
      this.value = value;
      this.offset = 0;
    }
    _createClass(Packet, [{
      key: "pack",
      value: function pack() {
        if (!this.value) {
          throw new Error('OSC Packet can not be encoded with empty body');
        }
        return this.value.pack();
      }
    }, {
      key: "unpack",
      value: function unpack(dataView) {
        var initialOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        if (!(dataView instanceof DataView)) {
          throw new Error('OSC Packet expects an instance of type DataView');
        }
        if (dataView.byteLength % 4 !== 0) {
          throw new Error('OSC Packet byteLength has to be a multiple of four');
        }
        var head = new AtomicString();
        head.unpack(dataView, initialOffset);
        var item;
        if (head.value === BUNDLE_TAG) {
          item = new Bundle();
        } else {
          item = new Message();
        }
        item.unpack(dataView, initialOffset);
        this.offset = item.offset;
        this.value = item;
        return this.offset;
      }
    }]);
    return Packet;
  }();

  var defaultOptions$5 = {
    discardLateMessages: false
  };
  var EventHandler = function () {
    function EventHandler(options) {
      _classCallCheck(this, EventHandler);
      this.options = _objectSpread2(_objectSpread2({}, defaultOptions$5), options);
      this.addressHandlers = [];
      this.eventHandlers = {
        open: [],
        error: [],
        close: []
      };
      this.uuid = 0;
    }
    _createClass(EventHandler, [{
      key: "dispatch",
      value: function dispatch(packet, rinfo) {
        var _this = this;
        if (!(packet instanceof Packet)) {
          throw new Error('OSC EventHander dispatch() accepts only arguments of type Packet');
        }
        if (!packet.value) {
          throw new Error('OSC EventHander dispatch() can\'t read empty Packets');
        }
        if (packet.value instanceof Bundle) {
          var bundle = packet.value;
          return bundle.bundleElements.forEach(function (bundleItem) {
            if (bundleItem instanceof Bundle) {
              if (bundle.timetag.value.timestamp() < bundleItem.timetag.value.timestamp()) {
                throw new Error('OSC Bundle timestamp is older than the timestamp of enclosed Bundles');
              }
              return _this.dispatch(bundleItem);
            } else if (bundleItem instanceof Message) {
              var message = bundleItem;
              return _this.notify(message.address, message, bundle.timetag.value.timestamp(), rinfo);
            }
            throw new Error('OSC EventHander dispatch() can\'t dispatch unknown Packet value');
          });
        } else if (packet.value instanceof Message) {
          var message = packet.value;
          return this.notify(message.address, message, 0, rinfo);
        }
        throw new Error('OSC EventHander dispatch() can\'t dispatch unknown Packet value');
      }
    }, {
      key: "call",
      value: function call(name, data, rinfo) {
        var success = false;
        if (isString(name) && name in this.eventHandlers) {
          this.eventHandlers[name].forEach(function (handler) {
            handler.callback(data, rinfo);
            success = true;
          });
          return success;
        }
        var handlerKeys = Object.keys(this.addressHandlers);
        var handlers = this.addressHandlers;
        handlerKeys.forEach(function (key) {
          var foundMatch = false;
          var regex = new RegExp(prepareRegExPattern(prepareAddress(name)), 'g');
          var test = regex.test(key);
          if (test && key.length === regex.lastIndex) {
            foundMatch = true;
          }
          if (!foundMatch) {
            var reverseRegex = new RegExp(prepareRegExPattern(prepareAddress(key)), 'g');
            var reverseTest = reverseRegex.test(name);
            if (reverseTest && name.length === reverseRegex.lastIndex) {
              foundMatch = true;
            }
          }
          if (foundMatch) {
            handlers[key].forEach(function (handler) {
              handler.callback(data, rinfo);
              success = true;
            });
          }
        });
        return success;
      }
    }, {
      key: "notify",
      value: function notify() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        if (args.length === 0) {
          throw new Error('OSC EventHandler can not be called without any argument');
        }
        if (args[0] instanceof Packet) {
          return this.dispatch(args[0], args[1]);
        } else if (args[0] instanceof Bundle || args[0] instanceof Message) {
          return this.dispatch(new Packet(args[0]), args[1]);
        } else if (!isString(args[0])) {
          var packet = new Packet();
          packet.unpack(dataView(args[0]));
          return this.dispatch(packet, args[1]);
        }
        var name = args[0];
        var data = null;
        if (args.length > 1) {
          data = args[1];
        }
        var timestamp = null;
        if (args.length > 2) {
          if (isInt(args[2])) {
            timestamp = args[2];
          } else if (args[2] instanceof Date) {
            timestamp = args[2].getTime();
          } else {
            throw new Error('OSC EventHandler timestamp has to be a number or Date');
          }
        }
        var rinfo = null;
        if (args.length >= 3) {
          rinfo = args[3];
        }
        if (timestamp) {
          var now = Date.now();
          if (now > timestamp) {
            if (!this.options.discardLateMessages) {
              return this.call(name, data, rinfo);
            }
          }
          var that = this;
          setTimeout(function () {
            that.call(name, data, rinfo);
          }, timestamp - now);
          return true;
        }
        return this.call(name, data, rinfo);
      }
    }, {
      key: "on",
      value: function on(name, callback) {
        if (!(isString(name) || isArray(name))) {
          throw new Error('OSC EventHandler accepts only strings or arrays for address patterns');
        }
        if (!isFunction(callback)) {
          throw new Error('OSC EventHandler callback has to be a function');
        }
        this.uuid += 1;
        var handler = {
          id: this.uuid,
          callback: callback
        };
        if (isString(name) && name in this.eventHandlers) {
          this.eventHandlers[name].push(handler);
          return this.uuid;
        }
        var address = prepareAddress(name);
        if (!(address in this.addressHandlers)) {
          this.addressHandlers[address] = [];
        }
        this.addressHandlers[address].push(handler);
        return this.uuid;
      }
    }, {
      key: "off",
      value: function off(name, subscriptionId) {
        if (!(isString(name) || isArray(name))) {
          throw new Error('OSC EventHandler accepts only strings or arrays for address patterns');
        }
        if (!isInt(subscriptionId)) {
          throw new Error('OSC EventHandler subscription id has to be a number');
        }
        var key;
        var haystack;
        if (isString(name) && name in this.eventHandlers) {
          key = name;
          haystack = this.eventHandlers;
        } else {
          key = prepareAddress(name);
          haystack = this.addressHandlers;
        }
        if (key in haystack) {
          return haystack[key].some(function (item, index) {
            if (item.id === subscriptionId) {
              haystack[key].splice(index, 1);
              return true;
            }
            return false;
          });
        }
        return false;
      }
    }]);
    return EventHandler;
  }();

  var dgram$1 = /* typeof window !== 'undefined' ? require('dgram') : */ undefined;
  var STATUS$4 = {
    IS_NOT_INITIALIZED: -1,
    IS_CONNECTING: 0,
    IS_OPEN: 1,
    IS_CLOSING: 2,
    IS_CLOSED: 3
  };
  var defaultOpenOptions = {
    host: 'localhost',
    port: 41234,
    exclusive: false
  };
  var defaultSendOptions = {
    host: 'localhost',
    port: 41235
  };
  var defaultOptions$4 = {
    type: 'udp4',
    open: defaultOpenOptions,
    send: defaultSendOptions
  };
  function mergeOptions$1(base, custom) {
    return _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, defaultOptions$4), base), custom), {}, {
      open: _objectSpread2(_objectSpread2(_objectSpread2({}, defaultOptions$4.open), base.open), custom.open),
      send: _objectSpread2(_objectSpread2(_objectSpread2({}, defaultOptions$4.send), base.send), custom.send)
    });
  }
  var DatagramPlugin = function () {
    function DatagramPlugin() {
      var _this = this;
      var customOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      _classCallCheck(this, DatagramPlugin);
      if (!dgram$1) {
        throw new Error('DatagramPlugin can not be used in browser context');
      }
      this.options = mergeOptions$1({}, customOptions);
      this.socket = dgram$1.createSocket(this.options.type);
      this.socketStatus = STATUS$4.IS_NOT_INITIALIZED;
      this.socket.on('message', function (message, rinfo) {
        _this.notify(message, rinfo);
      });
      this.socket.on('error', function (error) {
        _this.notify('error', error);
      });
      this.notify = function () {};
    }
    _createClass(DatagramPlugin, [{
      key: "registerNotify",
      value: function registerNotify(fn) {
        this.notify = fn;
      }
    }, {
      key: "status",
      value: function status() {
        return this.socketStatus;
      }
    }, {
      key: "open",
      value: function open() {
        var _this2 = this;
        var customOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var options = _objectSpread2(_objectSpread2({}, this.options.open), customOptions);
        var port = options.port,
            exclusive = options.exclusive;
        this.socketStatus = STATUS$4.IS_CONNECTING;
        this.socket.bind({
          address: options.host,
          port: port,
          exclusive: exclusive
        }, function () {
          _this2.socketStatus = STATUS$4.IS_OPEN;
          _this2.notify('open');
        });
      }
    }, {
      key: "close",
      value: function close() {
        var _this3 = this;
        this.socketStatus = STATUS$4.IS_CLOSING;
        this.socket.close(function () {
          _this3.socketStatus = STATUS$4.IS_CLOSED;
          _this3.notify('close');
        });
      }
    }, {
      key: "send",
      value: function send(binary) {
        var customOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var options = _objectSpread2(_objectSpread2({}, this.options.send), customOptions);
        var port = options.port,
            host = options.host;
        this.socket.send(Buffer.from(binary), 0, binary.byteLength, port, host);
      }
    }]);
    return DatagramPlugin;
  }();

  var dgram = /* typeof window !== 'undefined' ? require('dgram') : */ undefined;
  var WebSocketServer$1 = /* typeof window !== 'undefined' ? require('isomorphic-ws').Server : */ undefined;
  var STATUS$3 = {
    IS_NOT_INITIALIZED: -1,
    IS_CONNECTING: 0,
    IS_OPEN: 1,
    IS_CLOSING: 2,
    IS_CLOSED: 3
  };
  var defaultOptions$3 = {
    udpServer: {
      host: 'localhost',
      port: 41234,
      exclusive: false
    },
    udpClient: {
      host: 'localhost',
      port: 41235
    },
    wsServer: {
      host: 'localhost',
      port: 8080
    },
    receiver: 'ws'
  };
  function mergeOptions(base, custom) {
    return _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, defaultOptions$3), base), custom), {}, {
      udpServer: _objectSpread2(_objectSpread2(_objectSpread2({}, defaultOptions$3.udpServer), base.udpServer), custom.udpServer),
      udpClient: _objectSpread2(_objectSpread2(_objectSpread2({}, defaultOptions$3.udpClient), base.udpClient), custom.udpClient),
      wsServer: _objectSpread2(_objectSpread2(_objectSpread2({}, defaultOptions$3.wsServer), base.wsServer), custom.wsServer)
    });
  }
  var BridgePlugin = function () {
    function BridgePlugin() {
      var _this = this;
      var customOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      _classCallCheck(this, BridgePlugin);
      if (!dgram || !WebSocketServer$1) {
        throw new Error('BridgePlugin can not be used in browser context');
      }
      this.options = mergeOptions({}, customOptions);
      this.websocket = null;
      this.socket = dgram.createSocket('udp4');
      this.socketStatus = STATUS$3.IS_NOT_INITIALIZED;
      this.socket.on('message', function (message) {
        _this.send(message, {
          receiver: 'ws'
        });
        _this.notify(message.buffer);
      });
      this.socket.on('error', function (error) {
        _this.notify('error', error);
      });
      this.notify = function () {};
    }
    _createClass(BridgePlugin, [{
      key: "registerNotify",
      value: function registerNotify(fn) {
        this.notify = fn;
      }
    }, {
      key: "status",
      value: function status() {
        return this.socketStatus;
      }
    }, {
      key: "open",
      value: function open() {
        var _this2 = this;
        var customOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var options = mergeOptions(this.options, customOptions);
        this.socketStatus = STATUS$3.IS_CONNECTING;
        this.socket.bind({
          address: options.udpServer.host,
          port: options.udpServer.port,
          exclusive: options.udpServer.exclusive
        }, function () {
          var wsServerOptions = {};
          if (options.wsServer.server) wsServerOptions.server = options.wsServer.server;else wsServerOptions = options.wsServer;
          _this2.websocket = new WebSocketServer$1(wsServerOptions);
          _this2.websocket.binaryType = 'arraybuffer';
          _this2.websocket.on('listening', function () {
            _this2.socketStatus = STATUS$3.IS_OPEN;
            _this2.notify('open');
          });
          _this2.websocket.on('error', function (error) {
            _this2.notify('error', error);
          });
          _this2.websocket.on('connection', function (client) {
            client.on('message', function (message, rinfo) {
              _this2.send(message, {
                receiver: 'udp'
              });
              _this2.notify(new Uint8Array(message), rinfo);
            });
          });
        });
      }
    }, {
      key: "close",
      value: function close() {
        var _this3 = this;
        this.socketStatus = STATUS$3.IS_CLOSING;
        this.socket.close(function () {
          _this3.websocket.close(function () {
            _this3.socketStatus = STATUS$3.IS_CLOSED;
            _this3.notify('close');
          });
        });
      }
    }, {
      key: "send",
      value: function send(binary) {
        var customOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var options = mergeOptions(this.options, customOptions);
        var receiver = options.receiver;
        if (receiver === 'udp') {
          var data = binary instanceof Buffer ? binary : Buffer.from(binary);
          this.socket.send(data, 0, data.byteLength, options.udpClient.port, options.udpClient.host);
        } else if (receiver === 'ws') {
          this.websocket.clients.forEach(function (client) {
            client.send(binary, {
              binary: true
            });
          });
        } else {
          throw new Error('BridgePlugin can not send message to unknown receiver');
        }
      }
    }]);
    return BridgePlugin;
  }();

  var scope = typeof global === 'undefined' ? window : global;
  var WebSocket = typeof __dirname === 'undefined' ? scope.WebSocket : require('isomorphic-ws');
  var STATUS$2 = {
    IS_NOT_INITIALIZED: -1,
    IS_CONNECTING: 0,
    IS_OPEN: 1,
    IS_CLOSING: 2,
    IS_CLOSED: 3
  };
  var defaultOptions$2 = {
    host: 'localhost',
    port: 8080,
    secure: false,
    protocol: []
  };
  var WebsocketClientPlugin = function () {
    function WebsocketClientPlugin(customOptions) {
      _classCallCheck(this, WebsocketClientPlugin);
      if (!WebSocket) {
        throw new Error('WebsocketClientPlugin can\'t find a WebSocket class');
      }
      this.options = _objectSpread2(_objectSpread2({}, defaultOptions$2), customOptions);
      this.socket = null;
      this.socketStatus = STATUS$2.IS_NOT_INITIALIZED;
      this.notify = function () {};
    }
    _createClass(WebsocketClientPlugin, [{
      key: "registerNotify",
      value: function registerNotify(fn) {
        this.notify = fn;
      }
    }, {
      key: "status",
      value: function status() {
        return this.socketStatus;
      }
    }, {
      key: "open",
      value: function open() {
        var _this = this;
        var customOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var options = _objectSpread2(_objectSpread2({}, this.options), customOptions);
        var port = options.port,
            host = options.host,
            secure = options.secure,
            protocol = options.protocol;
        if (this.socket) {
          this.close();
        }
        var scheme = secure ? 'wss' : 'ws';
        var rinfo = {
          address: host,
          family: scheme,
          port: port,
          size: 0
        };
        this.socket = new WebSocket("".concat(scheme, "://").concat(host, ":").concat(port), protocol);
        this.socket.binaryType = 'arraybuffer';
        this.socketStatus = STATUS$2.IS_CONNECTING;
        this.socket.onopen = function () {
          _this.socketStatus = STATUS$2.IS_OPEN;
          _this.notify('open');
        };
        this.socket.onclose = function () {
          _this.socketStatus = STATUS$2.IS_CLOSED;
          _this.notify('close');
        };
        this.socket.onerror = function (error) {
          _this.notify('error', error);
        };
        this.socket.onmessage = function (message) {
          _this.notify(message.data, rinfo);
        };
      }
    }, {
      key: "close",
      value: function close() {
        this.socketStatus = STATUS$2.IS_CLOSING;
        this.socket.close();
      }
    }, {
      key: "send",
      value: function send(binary) {
        this.socket.send(binary);
      }
    }]);
    return WebsocketClientPlugin;
  }();

  var WebSocketServer = typeof __dirname !== 'undefined' ? require('isomorphic-ws').Server : undefined;
  var STATUS$1 = {
    IS_NOT_INITIALIZED: -1,
    IS_CONNECTING: 0,
    IS_OPEN: 1,
    IS_CLOSING: 2,
    IS_CLOSED: 3
  };
  var defaultOptions$1 = {
    host: 'localhost',
    port: 8080
  };
  var WebsocketServerPlugin = function () {
    function WebsocketServerPlugin(customOptions) {
      _classCallCheck(this, WebsocketServerPlugin);
      if (!WebSocketServer) {
        throw new Error('WebsocketServerPlugin can not be used in browser context');
      }
      this.options = _objectSpread2(_objectSpread2({}, defaultOptions$1), customOptions);
      this.socket = null;
      this.socketStatus = STATUS$1.IS_NOT_INITIALIZED;
      this.notify = function () {};
    }
    _createClass(WebsocketServerPlugin, [{
      key: "registerNotify",
      value: function registerNotify(fn) {
        this.notify = fn;
      }
    }, {
      key: "status",
      value: function status() {
        return this.socketStatus;
      }
    }, {
      key: "open",
      value: function open() {
        var _this = this;
        var customOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var options = _objectSpread2(_objectSpread2({}, this.options), customOptions);
        var port = options.port,
            host = options.host;
        var rinfo = {
          address: host,
          family: 'wsserver',
          port: port,
          size: 0
        };
        if (this.socket) {
          this.close();
        }
        if (options.server) {
          this.socket = new WebSocketServer({
            server: options.server
          });
        } else {
          this.socket = new WebSocketServer({
            host: host,
            port: port
          });
        }
        this.socket.binaryType = 'arraybuffer';
        this.socketStatus = STATUS$1.IS_CONNECTING;
        this.socket.on('listening', function () {
          _this.socketStatus = STATUS$1.IS_OPEN;
          _this.notify('open');
        });
        this.socket.on('error', function (error) {
          _this.notify('error', error);
        });
        this.socket.on('connection', function (client) {
          client.on('message', function (message) {
            _this.notify(new Uint8Array(message), rinfo);
          });
        });
      }
    }, {
      key: "close",
      value: function close() {
        var _this2 = this;
        this.socketStatus = STATUS$1.IS_CLOSING;
        this.socket.close(function () {
          _this2.socketStatus = STATUS$1.IS_CLOSED;
          _this2.notify('close');
        });
      }
    }, {
      key: "send",
      value: function send(binary) {
        this.socket.clients.forEach(function (client) {
          client.send(binary, {
            binary: true
          });
        });
      }
    }]);
    return WebsocketServerPlugin;
  }();

  var defaultOptions = {
    discardLateMessages: false,
    plugin: new WebsocketClientPlugin()
  };
  var STATUS = {
    IS_NOT_INITIALIZED: -1,
    IS_CONNECTING: 0,
    IS_OPEN: 1,
    IS_CLOSING: 2,
    IS_CLOSED: 3
  };
  var OSC = function () {
    function OSC(options) {
      _classCallCheck(this, OSC);
      if (options && !isObject(options)) {
        throw new Error('OSC options argument has to be an object.');
      }
      this.options = _objectSpread2(_objectSpread2({}, defaultOptions), options);
      this.eventHandler = new EventHandler({
        discardLateMessages: this.options.discardLateMessages
      });
      var eventHandler = this.eventHandler;
      if (this.options.plugin && this.options.plugin.registerNotify) {
        this.options.plugin.registerNotify(function () {
          return eventHandler.notify.apply(eventHandler, arguments);
        });
      }
    }
    _createClass(OSC, [{
      key: "on",
      value: function on(eventName, callback) {
        if (!(isString(eventName) && isFunction(callback))) {
          throw new Error('OSC on() needs event- or address string and callback function');
        }
        return this.eventHandler.on(eventName, callback);
      }
    }, {
      key: "off",
      value: function off(eventName, subscriptionId) {
        if (!(isString(eventName) && isInt(subscriptionId))) {
          throw new Error('OSC off() needs string and number (subscriptionId) to unsubscribe');
        }
        return this.eventHandler.off(eventName, subscriptionId);
      }
    }, {
      key: "open",
      value: function open(options) {
        if (options && !isObject(options)) {
          throw new Error('OSC open() options argument needs to be an object');
        }
        if (!(this.options.plugin && isFunction(this.options.plugin.open))) {
          throw new Error('OSC Plugin API #open is not implemented!');
        }
        return this.options.plugin.open(options);
      }
    }, {
      key: "status",
      value: function status() {
        if (!(this.options.plugin && isFunction(this.options.plugin.status))) {
          throw new Error('OSC Plugin API #status is not implemented!');
        }
        return this.options.plugin.status();
      }
    }, {
      key: "close",
      value: function close() {
        if (!(this.options.plugin && isFunction(this.options.plugin.close))) {
          throw new Error('OSC Plugin API #close is not implemented!');
        }
        return this.options.plugin.close();
      }
    }, {
      key: "send",
      value: function send(packet, options) {
        if (!(this.options.plugin && isFunction(this.options.plugin.send))) {
          throw new Error('OSC Plugin API #send is not implemented!');
        }
        if (!(packet instanceof TypedMessage || packet instanceof Message || packet instanceof Bundle || packet instanceof Packet)) {
          throw new Error('OSC send() needs Messages, Bundles or Packets');
        }
        if (options && !isObject(options)) {
          throw new Error('OSC send() options argument has to be an object');
        }
        return this.options.plugin.send(packet.pack(), options);
      }
    }]);
    return OSC;
  }();
  OSC.STATUS = STATUS;
  OSC.Packet = Packet;
  OSC.Bundle = Bundle;
  OSC.Message = Message;
  OSC.TypedMessage = TypedMessage;
  OSC.DatagramPlugin = DatagramPlugin;
  OSC.WebsocketClientPlugin = WebsocketClientPlugin;
  OSC.WebsocketServerPlugin = WebsocketServerPlugin;
  OSC.BridgePlugin = BridgePlugin;

  return OSC;

}));
