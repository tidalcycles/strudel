import { c as createCommonjsModule, g as getDefaultExportFromCjs } from './common/_commonjsHelpers-8c19dec8.js';
import { o as objectAssign } from './common/index-d01087d6.js';
import { d as dist$2 } from './common/index-1e63141f.js';

var ast = createCommonjsModule(function (module) {
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS'
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {

    function isExpression(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'ArrayExpression':
            case 'AssignmentExpression':
            case 'BinaryExpression':
            case 'CallExpression':
            case 'ConditionalExpression':
            case 'FunctionExpression':
            case 'Identifier':
            case 'Literal':
            case 'LogicalExpression':
            case 'MemberExpression':
            case 'NewExpression':
            case 'ObjectExpression':
            case 'SequenceExpression':
            case 'ThisExpression':
            case 'UnaryExpression':
            case 'UpdateExpression':
                return true;
        }
        return false;
    }

    function isIterationStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'DoWhileStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'WhileStatement':
                return true;
        }
        return false;
    }

    function isStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'BlockStatement':
            case 'BreakStatement':
            case 'ContinueStatement':
            case 'DebuggerStatement':
            case 'DoWhileStatement':
            case 'EmptyStatement':
            case 'ExpressionStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'IfStatement':
            case 'LabeledStatement':
            case 'ReturnStatement':
            case 'SwitchStatement':
            case 'ThrowStatement':
            case 'TryStatement':
            case 'VariableDeclaration':
            case 'WhileStatement':
            case 'WithStatement':
                return true;
        }
        return false;
    }

    function isSourceElement(node) {
      return isStatement(node) || node != null && node.type === 'FunctionDeclaration';
    }

    function trailingStatement(node) {
        switch (node.type) {
        case 'IfStatement':
            if (node.alternate != null) {
                return node.alternate;
            }
            return node.consequent;

        case 'LabeledStatement':
        case 'ForStatement':
        case 'ForInStatement':
        case 'WhileStatement':
        case 'WithStatement':
            return node.body;
        }
        return null;
    }

    function isProblematicIfStatement(node) {
        var current;

        if (node.type !== 'IfStatement') {
            return false;
        }
        if (node.alternate == null) {
            return false;
        }
        current = node.consequent;
        do {
            if (current.type === 'IfStatement') {
                if (current.alternate == null)  {
                    return true;
                }
            }
            current = trailingStatement(current);
        } while (current);

        return false;
    }

    module.exports = {
        isExpression: isExpression,
        isStatement: isStatement,
        isIterationStatement: isIterationStatement,
        isSourceElement: isSourceElement,
        isProblematicIfStatement: isProblematicIfStatement,

        trailingStatement: trailingStatement
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */
});

var code = createCommonjsModule(function (module) {
/*
  Copyright (C) 2013-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {

    var ES6Regex, ES5Regex, NON_ASCII_WHITESPACES, IDENTIFIER_START, IDENTIFIER_PART, ch;

    // See `tools/generate-identifier-regex.js`.
    ES5Regex = {
        // ECMAScript 5.1/Unicode v9.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
        // ECMAScript 5.1/Unicode v9.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
    };

    ES6Regex = {
        // ECMAScript 6/Unicode v9.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/,
        // ECMAScript 6/Unicode v9.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    function isDecimalDigit(ch) {
        return 0x30 <= ch && ch <= 0x39;  // 0..9
    }

    function isHexDigit(ch) {
        return 0x30 <= ch && ch <= 0x39 ||  // 0..9
            0x61 <= ch && ch <= 0x66 ||     // a..f
            0x41 <= ch && ch <= 0x46;       // A..F
    }

    function isOctalDigit(ch) {
        return ch >= 0x30 && ch <= 0x37;  // 0..7
    }

    // 7.2 White Space

    NON_ASCII_WHITESPACES = [
        0x1680,
        0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A,
        0x202F, 0x205F,
        0x3000,
        0xFEFF
    ];

    function isWhiteSpace(ch) {
        return ch === 0x20 || ch === 0x09 || ch === 0x0B || ch === 0x0C || ch === 0xA0 ||
            ch >= 0x1680 && NON_ASCII_WHITESPACES.indexOf(ch) >= 0;
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
    }

    // 7.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        if (cp <= 0xFFFF) { return String.fromCharCode(cp); }
        var cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
        var cu2 = String.fromCharCode(((cp - 0x10000) % 0x400) + 0xDC00);
        return cu1 + cu2;
    }

    IDENTIFIER_START = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_START[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    IDENTIFIER_PART = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_PART[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch >= 0x30 && ch <= 0x39 ||  // 0..9
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    function isIdentifierStartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES5Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES5Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    function isIdentifierStartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES6Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES6Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    module.exports = {
        isDecimalDigit: isDecimalDigit,
        isHexDigit: isHexDigit,
        isOctalDigit: isOctalDigit,
        isWhiteSpace: isWhiteSpace,
        isLineTerminator: isLineTerminator,
        isIdentifierStartES5: isIdentifierStartES5,
        isIdentifierPartES5: isIdentifierPartES5,
        isIdentifierStartES6: isIdentifierStartES6,
        isIdentifierPartES6: isIdentifierPartES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */
});

var keyword = createCommonjsModule(function (module) {
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {

    var code$1 = code;

    function isStrictModeReservedWordES6(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isKeywordES5(id, strict) {
        // yield should not be treated as keyword under non-strict mode.
        if (!strict && id === 'yield') {
            return false;
        }
        return isKeywordES6(id, strict);
    }

    function isKeywordES6(id, strict) {
        if (strict && isStrictModeReservedWordES6(id)) {
            return true;
        }

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    function isReservedWordES5(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES5(id, strict);
    }

    function isReservedWordES6(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES6(id, strict);
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    function isIdentifierNameES5(id) {
        var i, iz, ch;

        if (id.length === 0) { return false; }

        ch = id.charCodeAt(0);
        if (!code$1.isIdentifierStartES5(ch)) {
            return false;
        }

        for (i = 1, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (!code$1.isIdentifierPartES5(ch)) {
                return false;
            }
        }
        return true;
    }

    function decodeUtf16(lead, trail) {
        return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
    }

    function isIdentifierNameES6(id) {
        var i, iz, ch, lowCh, check;

        if (id.length === 0) { return false; }

        check = code$1.isIdentifierStartES6;
        for (i = 0, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (0xD800 <= ch && ch <= 0xDBFF) {
                ++i;
                if (i >= iz) { return false; }
                lowCh = id.charCodeAt(i);
                if (!(0xDC00 <= lowCh && lowCh <= 0xDFFF)) {
                    return false;
                }
                ch = decodeUtf16(ch, lowCh);
            }
            if (!check(ch)) {
                return false;
            }
            check = code$1.isIdentifierPartES6;
        }
        return true;
    }

    function isIdentifierES5(id, strict) {
        return isIdentifierNameES5(id) && !isReservedWordES5(id, strict);
    }

    function isIdentifierES6(id, strict) {
        return isIdentifierNameES6(id) && !isReservedWordES6(id, strict);
    }

    module.exports = {
        isKeywordES5: isKeywordES5,
        isKeywordES6: isKeywordES6,
        isReservedWordES5: isReservedWordES5,
        isReservedWordES6: isReservedWordES6,
        isRestrictedWord: isRestrictedWord,
        isIdentifierNameES5: isIdentifierNameES5,
        isIdentifierNameES6: isIdentifierNameES6,
        isIdentifierES5: isIdentifierES5,
        isIdentifierES6: isIdentifierES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */
});

var utils = createCommonjsModule(function (module, exports) {
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


(function () {

    exports.ast = ast;
    exports.code = code;
    exports.keyword = keyword;
}());
/* vim: set sw=4 ts=4 et tw=80 : */
});

var coderep = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.getPrecedence = getPrecedence;
exports.escapeStringLiteral = escapeStringLiteral;

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Precedence = {
  Sequence: 0,
  Yield: 1,
  Assignment: 1,
  Conditional: 2,
  ArrowFunction: 2,
  LogicalOR: 3,
  LogicalAND: 4,
  BitwiseOR: 5,
  BitwiseXOR: 6,
  BitwiseAND: 7,
  Equality: 8,
  Relational: 9,
  BitwiseSHIFT: 10,
  Additive: 11,
  Multiplicative: 12,
  Exponential: 13,
  Prefix: 14,
  Postfix: 15,
  New: 16,
  Call: 17,
  TaggedTemplate: 18,
  Member: 19,
  Primary: 20
};

exports.Precedence = Precedence;


var BinaryPrecedence = {
  ',': Precedence.Sequence,
  '||': Precedence.LogicalOR,
  '&&': Precedence.LogicalAND,
  '|': Precedence.BitwiseOR,
  '^': Precedence.BitwiseXOR,
  '&': Precedence.BitwiseAND,
  '==': Precedence.Equality,
  '!=': Precedence.Equality,
  '===': Precedence.Equality,
  '!==': Precedence.Equality,
  '<': Precedence.Relational,
  '>': Precedence.Relational,
  '<=': Precedence.Relational,
  '>=': Precedence.Relational,
  'in': Precedence.Relational,
  'instanceof': Precedence.Relational,
  '<<': Precedence.BitwiseSHIFT,
  '>>': Precedence.BitwiseSHIFT,
  '>>>': Precedence.BitwiseSHIFT,
  '+': Precedence.Additive,
  '-': Precedence.Additive,
  '*': Precedence.Multiplicative,
  '%': Precedence.Multiplicative,
  '/': Precedence.Multiplicative,
  '**': Precedence.Exponential
};

function getPrecedence(node) {
  switch (node.type) {
    case 'ArrayExpression':
    case 'FunctionExpression':
    case 'ClassExpression':
    case 'IdentifierExpression':
    case 'AssignmentTargetIdentifier':
    case 'NewTargetExpression':
    case 'Super':
    case 'LiteralBooleanExpression':
    case 'LiteralNullExpression':
    case 'LiteralNumericExpression':
    case 'LiteralInfinityExpression':
    case 'LiteralRegExpExpression':
    case 'LiteralStringExpression':
    case 'ObjectExpression':
    case 'ThisExpression':
    case 'SpreadElement':
    case 'FunctionBody':
      return Precedence.Primary;

    case 'ArrowExpression':
    case 'AssignmentExpression':
    case 'CompoundAssignmentExpression':
    case 'YieldExpression':
    case 'YieldGeneratorExpression':
      return Precedence.Assignment;

    case 'ConditionalExpression':
      return Precedence.Conditional;

    case 'ComputedMemberExpression':
    case 'StaticMemberExpression':
    case 'ComputedMemberAssignmentTarget':
    case 'StaticMemberAssignmentTarget':
      switch (node.object.type) {
        case 'CallExpression':
        case 'ComputedMemberExpression':
        case 'StaticMemberExpression':
        case 'TemplateExpression':
          return getPrecedence(node.object);
        default:
          return Precedence.Member;
      }

    case 'TemplateExpression':
      if (node.tag == null) return Precedence.Member;
      switch (node.tag.type) {
        case 'CallExpression':
        case 'ComputedMemberExpression':
        case 'StaticMemberExpression':
        case 'TemplateExpression':
          return getPrecedence(node.tag);
        default:
          return Precedence.Member;
      }

    case 'BinaryExpression':
      return BinaryPrecedence[node.operator];

    case 'CallExpression':
      return Precedence.Call;
    case 'NewExpression':
      return node.arguments.length === 0 ? Precedence.New : Precedence.Member;
    case 'UpdateExpression':
      return node.isPrefix ? Precedence.Prefix : Precedence.Postfix;
    case 'AwaitExpression':
    case 'UnaryExpression':
      return Precedence.Prefix;
    default:
      throw new Error('unreachable: ' + node.type);
  }
}

function escapeStringLiteral(stringValue) {
  var result = '';
  var nSingle = 0,
      nDouble = 0;
  for (var i = 0, l = stringValue.length; i < l; ++i) {
    var ch = stringValue[i];
    if (ch === '"') {
      ++nDouble;
    } else if (ch === '\'') {
      ++nSingle;
    }
  }
  var delim = nDouble > nSingle ? '\'' : '"';
  result += delim;
  for (var _i = 0; _i < stringValue.length; _i++) {
    var _ch = stringValue.charAt(_i);
    switch (_ch) {
      case delim:
        result += '\\' + delim;
        break;
      case '\n':
        result += '\\n';
        break;
      case '\r':
        result += '\\r';
        break;
      case '\\':
        result += '\\\\';
        break;
      case '\u2028':
        result += '\\u2028';
        break;
      case '\u2029':
        result += '\\u2029';
        break;
      default:
        result += _ch;
        break;
    }
  }
  result += delim;
  return result;
}

var CodeRep = exports.CodeRep = function () {
  function CodeRep() {
    _classCallCheck(this, CodeRep);

    this.containsIn = false;
    this.containsGroup = false;
    // restricted lookaheads: {, function, class, let, let [
    this.startsWithCurly = false;
    this.startsWithFunctionOrClass = false;
    this.startsWithLet = false;
    this.startsWithLetSquareBracket = false;
    this.endsWithMissingElse = false;
  }

  _createClass(CodeRep, [{
    key: 'forEach',
    value: function forEach(f) {
      // Call a function on every CodeRep represented by this node. Always calls f on a node and then its children, so if you're careful you can modify a node's children online.
      f(this);
    }
  }]);

  return CodeRep;
}();

var Empty = exports.Empty = function (_CodeRep) {
  _inherits(Empty, _CodeRep);

  function Empty() {
    _classCallCheck(this, Empty);

    return _possibleConstructorReturn(this, (Empty.__proto__ || Object.getPrototypeOf(Empty)).call(this));
  }

  _createClass(Empty, [{
    key: 'emit',
    value: function emit() {}
  }]);

  return Empty;
}(CodeRep);

var Token = exports.Token = function (_CodeRep2) {
  _inherits(Token, _CodeRep2);

  function Token(token) {
    var isRegExp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    _classCallCheck(this, Token);

    var _this2 = _possibleConstructorReturn(this, (Token.__proto__ || Object.getPrototypeOf(Token)).call(this));

    _this2.token = token;
    _this2.isRegExp = isRegExp;
    return _this2;
  }

  _createClass(Token, [{
    key: 'emit',
    value: function emit(ts) {
      ts.put(this.token, this.isRegExp);
    }
  }]);

  return Token;
}(CodeRep);

var RawToken = exports.RawToken = function (_CodeRep3) {
  _inherits(RawToken, _CodeRep3);

  function RawToken(token) {
    _classCallCheck(this, RawToken);

    var _this3 = _possibleConstructorReturn(this, (RawToken.__proto__ || Object.getPrototypeOf(RawToken)).call(this));

    _this3.token = token;
    return _this3;
  }

  _createClass(RawToken, [{
    key: 'emit',
    value: function emit(ts) {
      ts.putRaw(this.token);
    }
  }]);

  return RawToken;
}(CodeRep);

var NumberCodeRep = exports.NumberCodeRep = function (_CodeRep4) {
  _inherits(NumberCodeRep, _CodeRep4);

  function NumberCodeRep(number) {
    _classCallCheck(this, NumberCodeRep);

    var _this4 = _possibleConstructorReturn(this, (NumberCodeRep.__proto__ || Object.getPrototypeOf(NumberCodeRep)).call(this));

    _this4.number = number;
    return _this4;
  }

  _createClass(NumberCodeRep, [{
    key: 'emit',
    value: function emit(ts) {
      ts.putNumber(this.number);
    }
  }]);

  return NumberCodeRep;
}(CodeRep);

var Paren = exports.Paren = function (_CodeRep5) {
  _inherits(Paren, _CodeRep5);

  function Paren(expr) {
    _classCallCheck(this, Paren);

    var _this5 = _possibleConstructorReturn(this, (Paren.__proto__ || Object.getPrototypeOf(Paren)).call(this));

    _this5.expr = expr;
    return _this5;
  }

  _createClass(Paren, [{
    key: 'emit',
    value: function emit(ts) {
      ts.put('(');
      this.expr.emit(ts, false);
      ts.put(')');
    }
  }, {
    key: 'forEach',
    value: function forEach(f) {
      f(this);
      this.expr.forEach(f);
    }
  }]);

  return Paren;
}(CodeRep);

var Bracket = exports.Bracket = function (_CodeRep6) {
  _inherits(Bracket, _CodeRep6);

  function Bracket(expr) {
    _classCallCheck(this, Bracket);

    var _this6 = _possibleConstructorReturn(this, (Bracket.__proto__ || Object.getPrototypeOf(Bracket)).call(this));

    _this6.expr = expr;
    return _this6;
  }

  _createClass(Bracket, [{
    key: 'emit',
    value: function emit(ts) {
      ts.put('[');
      this.expr.emit(ts, false);
      ts.put(']');
    }
  }, {
    key: 'forEach',
    value: function forEach(f) {
      f(this);
      this.expr.forEach(f);
    }
  }]);

  return Bracket;
}(CodeRep);

var Brace = exports.Brace = function (_CodeRep7) {
  _inherits(Brace, _CodeRep7);

  function Brace(expr) {
    _classCallCheck(this, Brace);

    var _this7 = _possibleConstructorReturn(this, (Brace.__proto__ || Object.getPrototypeOf(Brace)).call(this));

    _this7.expr = expr;
    return _this7;
  }

  _createClass(Brace, [{
    key: 'emit',
    value: function emit(ts) {
      ts.put('{');
      this.expr.emit(ts, false);
      ts.put('}');
    }
  }, {
    key: 'forEach',
    value: function forEach(f) {
      f(this);
      this.expr.forEach(f);
    }
  }]);

  return Brace;
}(CodeRep);

var NoIn = exports.NoIn = function (_CodeRep8) {
  _inherits(NoIn, _CodeRep8);

  function NoIn(expr) {
    _classCallCheck(this, NoIn);

    var _this8 = _possibleConstructorReturn(this, (NoIn.__proto__ || Object.getPrototypeOf(NoIn)).call(this));

    _this8.expr = expr;
    return _this8;
  }

  _createClass(NoIn, [{
    key: 'emit',
    value: function emit(ts) {
      this.expr.emit(ts, true);
    }
  }, {
    key: 'forEach',
    value: function forEach(f) {
      f(this);
      this.expr.forEach(f);
    }
  }]);

  return NoIn;
}(CodeRep);

var ContainsIn = exports.ContainsIn = function (_CodeRep9) {
  _inherits(ContainsIn, _CodeRep9);

  function ContainsIn(expr) {
    _classCallCheck(this, ContainsIn);

    var _this9 = _possibleConstructorReturn(this, (ContainsIn.__proto__ || Object.getPrototypeOf(ContainsIn)).call(this));

    _this9.expr = expr;
    return _this9;
  }

  _createClass(ContainsIn, [{
    key: 'emit',
    value: function emit(ts, noIn) {
      if (noIn) {
        ts.put('(');
        this.expr.emit(ts, false);
        ts.put(')');
      } else {
        this.expr.emit(ts, false);
      }
    }
  }, {
    key: 'forEach',
    value: function forEach(f) {
      f(this);
      this.expr.forEach(f);
    }
  }]);

  return ContainsIn;
}(CodeRep);

var Seq = exports.Seq = function (_CodeRep10) {
  _inherits(Seq, _CodeRep10);

  function Seq(children) {
    _classCallCheck(this, Seq);

    var _this10 = _possibleConstructorReturn(this, (Seq.__proto__ || Object.getPrototypeOf(Seq)).call(this));

    _this10.children = children;
    return _this10;
  }

  _createClass(Seq, [{
    key: 'emit',
    value: function emit(ts, noIn) {
      this.children.forEach(function (cr) {
        return cr.emit(ts, noIn);
      });
    }
  }, {
    key: 'forEach',
    value: function forEach(f) {
      f(this);
      this.children.forEach(function (x) {
        return x.forEach(f);
      });
    }
  }]);

  return Seq;
}(CodeRep);

var Semi = exports.Semi = function (_Token) {
  _inherits(Semi, _Token);

  function Semi() {
    _classCallCheck(this, Semi);

    return _possibleConstructorReturn(this, (Semi.__proto__ || Object.getPrototypeOf(Semi)).call(this, ';'));
  }

  return Semi;
}(Token);

var CommaSep = exports.CommaSep = function (_CodeRep11) {
  _inherits(CommaSep, _CodeRep11);

  function CommaSep(children) {
    _classCallCheck(this, CommaSep);

    var _this12 = _possibleConstructorReturn(this, (CommaSep.__proto__ || Object.getPrototypeOf(CommaSep)).call(this));

    _this12.children = children;
    return _this12;
  }

  _createClass(CommaSep, [{
    key: 'emit',
    value: function emit(ts, noIn) {
      var first = true;
      this.children.forEach(function (cr) {
        if (first) {
          first = false;
        } else {
          ts.put(',');
        }
        cr.emit(ts, noIn);
      });
    }
  }, {
    key: 'forEach',
    value: function forEach(f) {
      f(this);
      this.children.forEach(function (x) {
        return x.forEach(f);
      });
    }
  }]);

  return CommaSep;
}(CodeRep);

var SemiOp = exports.SemiOp = function (_CodeRep12) {
  _inherits(SemiOp, _CodeRep12);

  function SemiOp() {
    _classCallCheck(this, SemiOp);

    return _possibleConstructorReturn(this, (SemiOp.__proto__ || Object.getPrototypeOf(SemiOp)).call(this));
  }

  _createClass(SemiOp, [{
    key: 'emit',
    value: function emit(ts) {
      ts.putOptionalSemi();
    }
  }]);

  return SemiOp;
}(CodeRep);
});

var minimalCodegen = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();



var _objectAssign2 = _interopRequireDefault(objectAssign);





function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function p(node, precedence, a) {
  return (0, coderep.getPrecedence)(node) < precedence ? paren(a) : a;
}

function t(token) {
  var isRegExp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  return new coderep.Token(token, isRegExp);
}

function paren(rep) {
  return new coderep.Paren(rep);
}

function brace(rep) {
  return new coderep.Brace(rep);
}

function bracket(rep) {
  return new coderep.Bracket(rep);
}

function noIn(rep) {
  return new coderep.NoIn(rep);
}

function markContainsIn(state) {
  return state.containsIn ? new coderep.ContainsIn(state) : state;
}

function seq() {
  for (var _len = arguments.length, reps = Array(_len), _key = 0; _key < _len; _key++) {
    reps[_key] = arguments[_key];
  }

  return new coderep.Seq(reps);
}

function semi() {
  return new coderep.Semi();
}

function semiOp() {
  return new coderep.SemiOp();
}

function empty() {
  return new coderep.Empty();
}

function commaSep(pieces) {
  return new coderep.CommaSep(pieces);
}

function getAssignmentExpr(state) {
  return state ? state.containsGroup ? paren(state) : state : empty();
}

var MinimalCodeGen = function () {
  function MinimalCodeGen() {
    _classCallCheck(this, MinimalCodeGen);
  }

  _createClass(MinimalCodeGen, [{
    key: 'parenToAvoidBeingDirective',
    value: function parenToAvoidBeingDirective(element, original) {
      if (element && element.type === 'ExpressionStatement' && element.expression.type === 'LiteralStringExpression') {
        return seq(paren(original.children[0]), semiOp());
      }
      return original;
    }
  }, {
    key: 'regenerateArrowParams',
    value: function regenerateArrowParams(element, original) {
      if (element.rest == null && element.items.length === 1 && element.items[0].type === 'BindingIdentifier') {
        // FormalParameters unconditionally include parentheses, but they're not necessary here
        return this.reduceBindingIdentifier(element.items[0]);
      }
      return original;
    }
  }, {
    key: 'reduceArrayExpression',
    value: function reduceArrayExpression(node, _ref) {
      var elements = _ref.elements;

      if (elements.length === 0) {
        return bracket(empty());
      }

      var content = commaSep(elements.map(getAssignmentExpr));
      if (elements.length > 0 && elements[elements.length - 1] == null) {
        content = seq(content, t(','));
      }
      return bracket(content);
    }
  }, {
    key: 'reduceAwaitExpression',
    value: function reduceAwaitExpression(node, _ref2) {
      var expression = _ref2.expression;

      return seq(t('await'), p(node.expression, (0, coderep.getPrecedence)(node), expression));
    }
  }, {
    key: 'reduceSpreadElement',
    value: function reduceSpreadElement(node, _ref3) {
      var expression = _ref3.expression;

      return seq(t('...'), p(node.expression, coderep.Precedence.Assignment, expression));
    }
  }, {
    key: 'reduceSpreadProperty',
    value: function reduceSpreadProperty(node, _ref4) {
      var expression = _ref4.expression;

      return seq(t('...'), getAssignmentExpr(expression));
    }
  }, {
    key: 'reduceAssignmentExpression',
    value: function reduceAssignmentExpression(node, _ref5) {
      var binding = _ref5.binding,
          expression = _ref5.expression;

      var leftCode = binding;
      var rightCode = expression;
      var containsIn = expression.containsIn;
      var startsWithCurly = binding.startsWithCurly;
      var startsWithLetSquareBracket = binding.startsWithLetSquareBracket;
      var startsWithFunctionOrClass = binding.startsWithFunctionOrClass;
      if ((0, coderep.getPrecedence)(node.expression) < (0, coderep.getPrecedence)(node)) {
        rightCode = paren(rightCode);
        containsIn = false;
      }
      return (0, _objectAssign2.default)(seq(leftCode, t('='), rightCode), { containsIn: containsIn, startsWithCurly: startsWithCurly, startsWithLetSquareBracket: startsWithLetSquareBracket, startsWithFunctionOrClass: startsWithFunctionOrClass });
    }
  }, {
    key: 'reduceAssignmentTargetIdentifier',
    value: function reduceAssignmentTargetIdentifier(node) {
      var a = t(node.name);
      if (node.name === 'let') {
        a.startsWithLet = true;
      }
      return a;
    }
  }, {
    key: 'reduceAssignmentTargetWithDefault',
    value: function reduceAssignmentTargetWithDefault(node, _ref6) {
      var binding = _ref6.binding,
          init = _ref6.init;

      return seq(binding, t('='), p(node.init, coderep.Precedence.Assignment, init));
    }
  }, {
    key: 'reduceCompoundAssignmentExpression',
    value: function reduceCompoundAssignmentExpression(node, _ref7) {
      var binding = _ref7.binding,
          expression = _ref7.expression;

      var leftCode = binding;
      var rightCode = expression;
      var containsIn = expression.containsIn;
      var startsWithCurly = binding.startsWithCurly;
      var startsWithLetSquareBracket = binding.startsWithLetSquareBracket;
      var startsWithFunctionOrClass = binding.startsWithFunctionOrClass;
      if ((0, coderep.getPrecedence)(node.expression) < (0, coderep.getPrecedence)(node)) {
        rightCode = paren(rightCode);
        containsIn = false;
      }
      return (0, _objectAssign2.default)(seq(leftCode, t(node.operator), rightCode), { containsIn: containsIn, startsWithCurly: startsWithCurly, startsWithLetSquareBracket: startsWithLetSquareBracket, startsWithFunctionOrClass: startsWithFunctionOrClass });
    }
  }, {
    key: 'reduceBinaryExpression',
    value: function reduceBinaryExpression(node, _ref8) {
      var left = _ref8.left,
          right = _ref8.right;

      var leftCode = left;
      var startsWithCurly = left.startsWithCurly;
      var startsWithLetSquareBracket = left.startsWithLetSquareBracket;
      var startsWithFunctionOrClass = left.startsWithFunctionOrClass;
      var leftContainsIn = left.containsIn;
      var isRightAssociative = node.operator === '**';
      if ((0, coderep.getPrecedence)(node.left) < (0, coderep.getPrecedence)(node) || isRightAssociative && ((0, coderep.getPrecedence)(node.left) === (0, coderep.getPrecedence)(node) || node.left.type === 'UnaryExpression')) {
        leftCode = paren(leftCode);
        startsWithCurly = false;
        startsWithLetSquareBracket = false;
        startsWithFunctionOrClass = false;
        leftContainsIn = false;
      }
      var rightCode = right;
      var rightContainsIn = right.containsIn;
      if ((0, coderep.getPrecedence)(node.right) < (0, coderep.getPrecedence)(node) || !isRightAssociative && (0, coderep.getPrecedence)(node.right) === (0, coderep.getPrecedence)(node)) {
        rightCode = paren(rightCode);
        rightContainsIn = false;
      }
      return (0, _objectAssign2.default)(seq(leftCode, t(node.operator), rightCode), {
        containsIn: leftContainsIn || rightContainsIn || node.operator === 'in',
        containsGroup: node.operator === ',',
        startsWithCurly: startsWithCurly,
        startsWithLetSquareBracket: startsWithLetSquareBracket,
        startsWithFunctionOrClass: startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceBindingWithDefault',
    value: function reduceBindingWithDefault(node, _ref9) {
      var binding = _ref9.binding,
          init = _ref9.init;

      return seq(binding, t('='), p(node.init, coderep.Precedence.Assignment, init));
    }
  }, {
    key: 'reduceBindingIdentifier',
    value: function reduceBindingIdentifier(node) {
      var a = t(node.name);
      if (node.name === 'let') {
        a.startsWithLet = true;
      }
      return a;
    }
  }, {
    key: 'reduceArrayAssignmentTarget',
    value: function reduceArrayAssignmentTarget(node, _ref10) {
      var elements = _ref10.elements,
          rest = _ref10.rest;

      var content = void 0;
      if (elements.length === 0) {
        content = rest == null ? empty() : seq(t('...'), rest);
      } else {
        elements = elements.concat(rest == null ? [] : [seq(t('...'), rest)]);
        content = commaSep(elements.map(getAssignmentExpr));
        if (elements.length > 0 && elements[elements.length - 1] == null) {
          content = seq(content, t(','));
        }
      }
      return bracket(content);
    }
  }, {
    key: 'reduceArrayBinding',
    value: function reduceArrayBinding(node, _ref11) {
      var elements = _ref11.elements,
          rest = _ref11.rest;

      var content = void 0;
      if (elements.length === 0) {
        content = rest == null ? empty() : seq(t('...'), rest);
      } else {
        elements = elements.concat(rest == null ? [] : [seq(t('...'), rest)]);
        content = commaSep(elements.map(getAssignmentExpr));
        if (elements.length > 0 && elements[elements.length - 1] == null) {
          content = seq(content, t(','));
        }
      }
      return bracket(content);
    }
  }, {
    key: 'reduceObjectAssignmentTarget',
    value: function reduceObjectAssignmentTarget(node, _ref12) {
      var properties = _ref12.properties,
          rest = _ref12.rest;

      var content = commaSep(properties);
      if (properties.length === 0) {
        content = rest == null ? empty() : seq(t('...'), rest);
      } else {
        content = rest == null ? content : seq(content, t(','), t('...'), rest);
      }
      var state = brace(content);
      state.startsWithCurly = true;
      return state;
    }
  }, {
    key: 'reduceObjectBinding',
    value: function reduceObjectBinding(node, _ref13) {
      var properties = _ref13.properties,
          rest = _ref13.rest;

      var content = commaSep(properties);
      if (properties.length === 0) {
        content = rest == null ? empty() : seq(t('...'), rest);
      } else {
        content = rest == null ? content : seq(content, t(','), t('...'), rest);
      }
      var state = brace(content);
      state.startsWithCurly = true;
      return state;
    }
  }, {
    key: 'reduceAssignmentTargetPropertyIdentifier',
    value: function reduceAssignmentTargetPropertyIdentifier(node, _ref14) {
      var binding = _ref14.binding,
          init = _ref14.init;

      if (node.init == null) return binding;
      return seq(binding, t('='), p(node.init, coderep.Precedence.Assignment, init));
    }
  }, {
    key: 'reduceAssignmentTargetPropertyProperty',
    value: function reduceAssignmentTargetPropertyProperty(node, _ref15) {
      var name = _ref15.name,
          binding = _ref15.binding;

      return seq(name, t(':'), binding);
    }
  }, {
    key: 'reduceBindingPropertyIdentifier',
    value: function reduceBindingPropertyIdentifier(node, _ref16) {
      var binding = _ref16.binding,
          init = _ref16.init;

      if (node.init == null) return binding;
      return seq(binding, t('='), p(node.init, coderep.Precedence.Assignment, init));
    }
  }, {
    key: 'reduceBindingPropertyProperty',
    value: function reduceBindingPropertyProperty(node, _ref17) {
      var name = _ref17.name,
          binding = _ref17.binding;

      return seq(name, t(':'), binding);
    }
  }, {
    key: 'reduceBlock',
    value: function reduceBlock(node, _ref18) {
      var statements = _ref18.statements;

      return brace(seq.apply(undefined, _toConsumableArray(statements)));
    }
  }, {
    key: 'reduceBlockStatement',
    value: function reduceBlockStatement(node, _ref19) {
      var block = _ref19.block;

      return block;
    }
  }, {
    key: 'reduceBreakStatement',
    value: function reduceBreakStatement(node) {
      return seq(t('break'), node.label ? t(node.label) : empty(), semiOp());
    }
  }, {
    key: 'reduceCallExpression',
    value: function reduceCallExpression(node, _ref20) {
      var callee = _ref20.callee,
          args = _ref20.arguments;

      var parenthizedArgs = args.map(function (a, i) {
        return p(node.arguments[i], coderep.Precedence.Assignment, a);
      });
      return (0, _objectAssign2.default)(seq(p(node.callee, (0, coderep.getPrecedence)(node), callee), paren(commaSep(parenthizedArgs))), {
        startsWithCurly: callee.startsWithCurly,
        startsWithLet: callee.startsWithLet,
        startsWithLetSquareBracket: callee.startsWithLetSquareBracket,
        startsWithFunctionOrClass: callee.startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceCatchClause',
    value: function reduceCatchClause(node, _ref21) {
      var binding = _ref21.binding,
          body = _ref21.body;

      return seq(t('catch'), paren(binding), body);
    }
  }, {
    key: 'reduceClassDeclaration',
    value: function reduceClassDeclaration(node, _ref22) {
      var name = _ref22.name,
          _super = _ref22.super,
          elements = _ref22.elements;

      var state = seq(t('class'), node.name.name === '*default*' ? empty() : name);
      if (_super != null) {
        state = seq(state, t('extends'), p(node.super, coderep.Precedence.New, _super));
      }
      state = seq.apply(undefined, [state, t('{')].concat(_toConsumableArray(elements), [t('}')]));
      return state;
    }
  }, {
    key: 'reduceClassExpression',
    value: function reduceClassExpression(node, _ref23) {
      var name = _ref23.name,
          _super = _ref23.super,
          elements = _ref23.elements;

      var state = t('class');
      if (name != null) {
        state = seq(state, name);
      }
      if (_super != null) {
        state = seq(state, t('extends'), p(node.super, coderep.Precedence.New, _super));
      }
      state = seq.apply(undefined, [state, t('{')].concat(_toConsumableArray(elements), [t('}')]));
      state.startsWithFunctionOrClass = true;
      return state;
    }
  }, {
    key: 'reduceClassElement',
    value: function reduceClassElement(node, _ref24) {
      var method = _ref24.method;

      if (!node.isStatic) return method;
      return seq(t('static'), method);
    }
  }, {
    key: 'reduceComputedMemberAssignmentTarget',
    value: function reduceComputedMemberAssignmentTarget(node, _ref25) {
      var object = _ref25.object,
          expression = _ref25.expression;

      var startsWithLetSquareBracket = object.startsWithLetSquareBracket || node.object.type === 'IdentifierExpression' && node.object.name === 'let';
      return (0, _objectAssign2.default)(seq(p(node.object, (0, coderep.getPrecedence)(node), object), bracket(expression)), {
        startsWithLet: object.startsWithLet,
        startsWithLetSquareBracket: startsWithLetSquareBracket,
        startsWithCurly: object.startsWithCurly,
        startsWithFunctionOrClass: object.startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceComputedMemberExpression',
    value: function reduceComputedMemberExpression(node, _ref26) {
      var object = _ref26.object,
          expression = _ref26.expression;

      var startsWithLetSquareBracket = object.startsWithLetSquareBracket || node.object.type === 'IdentifierExpression' && node.object.name === 'let';
      return (0, _objectAssign2.default)(seq(p(node.object, (0, coderep.getPrecedence)(node), object), bracket(expression)), {
        startsWithLet: object.startsWithLet,
        startsWithLetSquareBracket: startsWithLetSquareBracket,
        startsWithCurly: object.startsWithCurly,
        startsWithFunctionOrClass: object.startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceComputedPropertyName',
    value: function reduceComputedPropertyName(node, _ref27) {
      var expression = _ref27.expression;

      return bracket(p(node.expression, coderep.Precedence.Assignment, expression));
    }
  }, {
    key: 'reduceConditionalExpression',
    value: function reduceConditionalExpression(node, _ref28) {
      var test = _ref28.test,
          consequent = _ref28.consequent,
          alternate = _ref28.alternate;

      var containsIn = test.containsIn || alternate.containsIn;
      var startsWithCurly = test.startsWithCurly;
      var startsWithLetSquareBracket = test.startsWithLetSquareBracket;
      var startsWithFunctionOrClass = test.startsWithFunctionOrClass;
      return (0, _objectAssign2.default)(seq(p(node.test, coderep.Precedence.LogicalOR, test), t('?'), p(node.consequent, coderep.Precedence.Assignment, consequent), t(':'), p(node.alternate, coderep.Precedence.Assignment, alternate)), {
        containsIn: containsIn,
        startsWithCurly: startsWithCurly,
        startsWithLetSquareBracket: startsWithLetSquareBracket,
        startsWithFunctionOrClass: startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceContinueStatement',
    value: function reduceContinueStatement(node) {
      return seq(t('continue'), node.label ? t(node.label) : empty(), semiOp());
    }
  }, {
    key: 'reduceDataProperty',
    value: function reduceDataProperty(node, _ref29) {
      var name = _ref29.name,
          expression = _ref29.expression;

      return seq(name, t(':'), getAssignmentExpr(expression));
    }
  }, {
    key: 'reduceDebuggerStatement',
    value: function reduceDebuggerStatement() /* node */{
      return seq(t('debugger'), semiOp());
    }
  }, {
    key: 'reduceDoWhileStatement',
    value: function reduceDoWhileStatement(node, _ref30) {
      var body = _ref30.body,
          test = _ref30.test;

      return seq(t('do'), body, t('while'), paren(test), semiOp());
    }
  }, {
    key: 'reduceEmptyStatement',
    value: function reduceEmptyStatement() /* node */{
      return semi();
    }
  }, {
    key: 'reduceExpressionStatement',
    value: function reduceExpressionStatement(node, _ref31) {
      var expression = _ref31.expression;

      var needsParens = expression.startsWithCurly || expression.startsWithLetSquareBracket || expression.startsWithFunctionOrClass;
      return seq(needsParens ? paren(expression) : expression, semiOp());
    }
  }, {
    key: 'reduceForInStatement',
    value: function reduceForInStatement(node, _ref32) {
      var left = _ref32.left,
          right = _ref32.right,
          body = _ref32.body;

      left = node.left.type === 'VariableDeclaration' ? noIn(markContainsIn(left)) : left;
      return (0, _objectAssign2.default)(seq(t('for'), paren(seq(left.startsWithLet ? paren(left) : left, t('in'), right)), body), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: 'reduceForOfStatement',
    value: function reduceForOfStatement(node, _ref33) {
      var left = _ref33.left,
          right = _ref33.right,
          body = _ref33.body;

      left = node.left.type === 'VariableDeclaration' ? noIn(markContainsIn(left)) : left;
      return (0, _objectAssign2.default)(seq(t('for'), paren(seq(left.startsWithLet ? paren(left) : left, t('of'), p(node.right, coderep.Precedence.Assignment, right))), body), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: 'reduceForStatement',
    value: function reduceForStatement(node, _ref34) {
      var init = _ref34.init,
          test = _ref34.test,
          update = _ref34.update,
          body = _ref34.body;

      if (init) {
        if (init.startsWithLetSquareBracket) {
          init = paren(init);
        }
        init = noIn(markContainsIn(init));
      }
      return (0, _objectAssign2.default)(seq(t('for'), paren(seq(init ? init : empty(), semi(), test || empty(), semi(), update || empty())), body), {
        endsWithMissingElse: body.endsWithMissingElse
      });
    }
  }, {
    key: 'reduceForAwaitStatement',
    value: function reduceForAwaitStatement(node, _ref35) {
      var left = _ref35.left,
          right = _ref35.right,
          body = _ref35.body;

      left = node.left.type === 'VariableDeclaration' ? noIn(markContainsIn(left)) : left;
      return (0, _objectAssign2.default)(seq(t('for'), t('await'), paren(seq(left.startsWithLet ? paren(left) : left, t('of'), p(node.right, coderep.Precedence.Assignment, right))), body), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: 'reduceFunctionBody',
    value: function reduceFunctionBody(node, _ref36) {
      var directives = _ref36.directives,
          statements = _ref36.statements;

      if (statements.length) {
        statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
      }
      return brace(seq.apply(undefined, _toConsumableArray(directives).concat(_toConsumableArray(statements))));
    }
  }, {
    key: 'reduceFunctionDeclaration',
    value: function reduceFunctionDeclaration(node, _ref37) {
      var name = _ref37.name,
          params = _ref37.params,
          body = _ref37.body;

      return seq(node.isAsync ? t('async') : empty(), t('function'), node.isGenerator ? t('*') : empty(), node.name.name === '*default*' ? empty() : name, params, body);
    }
  }, {
    key: 'reduceFunctionExpression',
    value: function reduceFunctionExpression(node, _ref38) {
      var name = _ref38.name,
          params = _ref38.params,
          body = _ref38.body;

      var state = seq(node.isAsync ? t('async') : empty(), t('function'), node.isGenerator ? t('*') : empty(), name ? name : empty(), params, body);
      state.startsWithFunctionOrClass = true;
      return state;
    }
  }, {
    key: 'reduceFormalParameters',
    value: function reduceFormalParameters(node, _ref39) {
      var items = _ref39.items,
          rest = _ref39.rest;

      return paren(commaSep(items.concat(rest == null ? [] : [seq(t('...'), rest)])));
    }
  }, {
    key: 'reduceArrowExpression',
    value: function reduceArrowExpression(node, _ref40) {
      var params = _ref40.params,
          body = _ref40.body;

      params = this.regenerateArrowParams(node.params, params);
      var containsIn = false;
      if (node.body.type !== 'FunctionBody') {
        if (body.startsWithCurly) {
          body = paren(body);
        } else if (body.containsIn) {
          containsIn = true;
        }
      }
      return (0, _objectAssign2.default)(seq(node.isAsync ? t('async') : empty(), params, t('=>'), p(node.body, coderep.Precedence.Assignment, body)), { containsIn: containsIn });
    }
  }, {
    key: 'reduceGetter',
    value: function reduceGetter(node, _ref41) {
      var name = _ref41.name,
          body = _ref41.body;

      return seq(t('get'), name, paren(empty()), body);
    }
  }, {
    key: 'reduceIdentifierExpression',
    value: function reduceIdentifierExpression(node) {
      var a = t(node.name);
      if (node.name === 'let') {
        a.startsWithLet = true;
      }
      return a;
    }
  }, {
    key: 'reduceIfStatement',
    value: function reduceIfStatement(node, _ref42) {
      var test = _ref42.test,
          consequent = _ref42.consequent,
          alternate = _ref42.alternate;

      if (alternate && consequent.endsWithMissingElse) {
        consequent = brace(consequent);
      }
      return (0, _objectAssign2.default)(seq(t('if'), paren(test), consequent, alternate ? seq(t('else'), alternate) : empty()), { endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true });
    }
  }, {
    key: 'reduceImport',
    value: function reduceImport(node, _ref43) {
      var defaultBinding = _ref43.defaultBinding,
          namedImports = _ref43.namedImports;

      var bindings = [];
      if (defaultBinding != null) {
        bindings.push(defaultBinding);
      }
      if (namedImports.length > 0) {
        bindings.push(brace(commaSep(namedImports)));
      }
      if (bindings.length === 0) {
        return seq(t('import'), t((0, coderep.escapeStringLiteral)(node.moduleSpecifier)), semiOp());
      }
      return seq(t('import'), commaSep(bindings), t('from'), t((0, coderep.escapeStringLiteral)(node.moduleSpecifier)), semiOp());
    }
  }, {
    key: 'reduceImportNamespace',
    value: function reduceImportNamespace(node, _ref44) {
      var defaultBinding = _ref44.defaultBinding,
          namespaceBinding = _ref44.namespaceBinding;

      return seq(t('import'), defaultBinding == null ? empty() : seq(defaultBinding, t(',')), t('*'), t('as'), namespaceBinding, t('from'), t((0, coderep.escapeStringLiteral)(node.moduleSpecifier)), semiOp());
    }
  }, {
    key: 'reduceImportSpecifier',
    value: function reduceImportSpecifier(node, _ref45) {
      var binding = _ref45.binding;

      if (node.name == null) return binding;
      return seq(t(node.name), t('as'), binding);
    }
  }, {
    key: 'reduceExportAllFrom',
    value: function reduceExportAllFrom(node) {
      return seq(t('export'), t('*'), t('from'), t((0, coderep.escapeStringLiteral)(node.moduleSpecifier)), semiOp());
    }
  }, {
    key: 'reduceExportFrom',
    value: function reduceExportFrom(node, _ref46) {
      var namedExports = _ref46.namedExports;

      return seq(t('export'), brace(commaSep(namedExports)), t('from'), t((0, coderep.escapeStringLiteral)(node.moduleSpecifier)), semiOp());
    }
  }, {
    key: 'reduceExportLocals',
    value: function reduceExportLocals(node, _ref47) {
      var namedExports = _ref47.namedExports;

      return seq(t('export'), brace(commaSep(namedExports)), semiOp());
    }
  }, {
    key: 'reduceExport',
    value: function reduceExport(node, _ref48) {
      var declaration = _ref48.declaration;

      switch (node.declaration.type) {
        case 'FunctionDeclaration':
        case 'ClassDeclaration':
          break;
        default:
          declaration = seq(declaration, semiOp());
      }
      return seq(t('export'), declaration);
    }
  }, {
    key: 'reduceExportDefault',
    value: function reduceExportDefault(node, _ref49) {
      var body = _ref49.body;

      body = body.startsWithFunctionOrClass ? paren(body) : body;
      switch (node.body.type) {
        case 'FunctionDeclaration':
        case 'ClassDeclaration':
          return seq(t('export default'), body);
        default:
          return seq(t('export default'), p(node.body, coderep.Precedence.Assignment, body), semiOp());
      }
    }
  }, {
    key: 'reduceExportFromSpecifier',
    value: function reduceExportFromSpecifier(node) {
      if (node.exportedName == null) return t(node.name);
      return seq(t(node.name), t('as'), t(node.exportedName));
    }
  }, {
    key: 'reduceExportLocalSpecifier',
    value: function reduceExportLocalSpecifier(node, _ref50) {
      var name = _ref50.name;

      if (node.exportedName == null) return name;
      return seq(name, t('as'), t(node.exportedName));
    }
  }, {
    key: 'reduceLabeledStatement',
    value: function reduceLabeledStatement(node, _ref51) {
      var body = _ref51.body;

      return (0, _objectAssign2.default)(seq(t(node.label + ':'), body), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: 'reduceLiteralBooleanExpression',
    value: function reduceLiteralBooleanExpression(node) {
      return t(node.value.toString());
    }
  }, {
    key: 'reduceLiteralNullExpression',
    value: function reduceLiteralNullExpression() /* node */{
      return t('null');
    }
  }, {
    key: 'reduceLiteralInfinityExpression',
    value: function reduceLiteralInfinityExpression() /* node */{
      return t('2e308');
    }
  }, {
    key: 'reduceLiteralNumericExpression',
    value: function reduceLiteralNumericExpression(node) {
      return new coderep.NumberCodeRep(node.value);
    }
  }, {
    key: 'reduceLiteralRegExpExpression',
    value: function reduceLiteralRegExpExpression(node) {
      return t('/' + node.pattern + '/' + (node.global ? 'g' : '') + (node.ignoreCase ? 'i' : '') + (node.multiLine ? 'm' : '') + (node.dotAll ? 's' : '') + (node.unicode ? 'u' : '') + (node.sticky ? 'y' : ''), true);
    }
  }, {
    key: 'reduceLiteralStringExpression',
    value: function reduceLiteralStringExpression(node) {
      return t((0, coderep.escapeStringLiteral)(node.value));
    }
  }, {
    key: 'reduceMethod',
    value: function reduceMethod(node, _ref52) {
      var name = _ref52.name,
          params = _ref52.params,
          body = _ref52.body;

      return seq(node.isAsync ? t('async') : empty(), node.isGenerator ? t('*') : empty(), name, params, body);
    }
  }, {
    key: 'reduceModule',
    value: function reduceModule(node, _ref53) {
      var directives = _ref53.directives,
          items = _ref53.items;

      if (items.length) {
        items[0] = this.parenToAvoidBeingDirective(node.items[0], items[0]);
      }
      return seq.apply(undefined, _toConsumableArray(directives).concat(_toConsumableArray(items)));
    }
  }, {
    key: 'reduceNewExpression',
    value: function reduceNewExpression(node, _ref54) {
      var callee = _ref54.callee,
          args = _ref54.arguments;

      var parenthizedArgs = args.map(function (a, i) {
        return p(node.arguments[i], coderep.Precedence.Assignment, a);
      });
      var calleeRep = (0, coderep.getPrecedence)(node.callee) === coderep.Precedence.Call ? paren(callee) : p(node.callee, (0, coderep.getPrecedence)(node), callee);
      return seq(t('new'), calleeRep, args.length === 0 ? empty() : paren(commaSep(parenthizedArgs)));
    }
  }, {
    key: 'reduceNewTargetExpression',
    value: function reduceNewTargetExpression() {
      return t('new.target');
    }
  }, {
    key: 'reduceObjectExpression',
    value: function reduceObjectExpression(node, _ref55) {
      var properties = _ref55.properties;

      var state = brace(commaSep(properties));
      state.startsWithCurly = true;
      return state;
    }
  }, {
    key: 'reduceUpdateExpression',
    value: function reduceUpdateExpression(node, _ref56) {
      var operand = _ref56.operand;

      if (node.isPrefix) {
        return this.reduceUnaryExpression.apply(this, arguments);
      }
      return (0, _objectAssign2.default)(seq(p(node.operand, coderep.Precedence.New, operand), t(node.operator)), {
        startsWithCurly: operand.startsWithCurly,
        startsWithLetSquareBracket: operand.startsWithLetSquareBracket,
        startsWithFunctionOrClass: operand.startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceUnaryExpression',
    value: function reduceUnaryExpression(node, _ref57) {
      var operand = _ref57.operand;

      return seq(t(node.operator), p(node.operand, (0, coderep.getPrecedence)(node), operand));
    }
  }, {
    key: 'reduceReturnStatement',
    value: function reduceReturnStatement(node, _ref58) {
      var expression = _ref58.expression;

      return seq(t('return'), expression || empty(), semiOp());
    }
  }, {
    key: 'reduceScript',
    value: function reduceScript(node, _ref59) {
      var directives = _ref59.directives,
          statements = _ref59.statements;

      if (statements.length) {
        statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
      }
      return seq.apply(undefined, _toConsumableArray(directives).concat(_toConsumableArray(statements)));
    }
  }, {
    key: 'reduceSetter',
    value: function reduceSetter(node, _ref60) {
      var name = _ref60.name,
          param = _ref60.param,
          body = _ref60.body;

      return seq(t('set'), name, paren(param), body);
    }
  }, {
    key: 'reduceShorthandProperty',
    value: function reduceShorthandProperty(node, _ref61) {
      var name = _ref61.name;

      return name;
    }
  }, {
    key: 'reduceStaticMemberAssignmentTarget',
    value: function reduceStaticMemberAssignmentTarget(node, _ref62) {
      var object = _ref62.object;

      var state = seq(p(node.object, (0, coderep.getPrecedence)(node), object), t('.'), t(node.property));
      state.startsWithLet = object.startsWithLet;
      state.startsWithCurly = object.startsWithCurly;
      state.startsWithLetSquareBracket = object.startsWithLetSquareBracket;
      state.startsWithFunctionOrClass = object.startsWithFunctionOrClass;
      return state;
    }
  }, {
    key: 'reduceStaticMemberExpression',
    value: function reduceStaticMemberExpression(node, _ref63) {
      var object = _ref63.object;

      var state = seq(p(node.object, (0, coderep.getPrecedence)(node), object), t('.'), t(node.property));
      state.startsWithLet = object.startsWithLet;
      state.startsWithCurly = object.startsWithCurly;
      state.startsWithLetSquareBracket = object.startsWithLetSquareBracket;
      state.startsWithFunctionOrClass = object.startsWithFunctionOrClass;
      return state;
    }
  }, {
    key: 'reduceStaticPropertyName',
    value: function reduceStaticPropertyName(node) {
      if (utils.keyword.isIdentifierNameES6(node.value)) {
        return t(node.value);
      }
      var n = parseFloat(node.value);
      if (n >= 0 && n.toString() === node.value) {
        return new coderep.NumberCodeRep(n);
      }
      return t((0, coderep.escapeStringLiteral)(node.value));
    }
  }, {
    key: 'reduceSuper',
    value: function reduceSuper() {
      return t('super');
    }
  }, {
    key: 'reduceSwitchCase',
    value: function reduceSwitchCase(node, _ref64) {
      var test = _ref64.test,
          consequent = _ref64.consequent;

      return seq(t('case'), test, t(':'), seq.apply(undefined, _toConsumableArray(consequent)));
    }
  }, {
    key: 'reduceSwitchDefault',
    value: function reduceSwitchDefault(node, _ref65) {
      var consequent = _ref65.consequent;

      return seq(t('default:'), seq.apply(undefined, _toConsumableArray(consequent)));
    }
  }, {
    key: 'reduceSwitchStatement',
    value: function reduceSwitchStatement(node, _ref66) {
      var discriminant = _ref66.discriminant,
          cases = _ref66.cases;

      return seq(t('switch'), paren(discriminant), brace(seq.apply(undefined, _toConsumableArray(cases))));
    }
  }, {
    key: 'reduceSwitchStatementWithDefault',
    value: function reduceSwitchStatementWithDefault(node, _ref67) {
      var discriminant = _ref67.discriminant,
          preDefaultCases = _ref67.preDefaultCases,
          defaultCase = _ref67.defaultCase,
          postDefaultCases = _ref67.postDefaultCases;

      return seq(t('switch'), paren(discriminant), brace(seq.apply(undefined, _toConsumableArray(preDefaultCases).concat([defaultCase], _toConsumableArray(postDefaultCases)))));
    }
  }, {
    key: 'reduceTemplateExpression',
    value: function reduceTemplateExpression(node, _ref68) {
      var tag = _ref68.tag,
          elements = _ref68.elements;

      var state = node.tag == null ? empty() : p(node.tag, (0, coderep.getPrecedence)(node), tag);
      state = seq(state, t('`'));
      for (var i = 0, l = node.elements.length; i < l; ++i) {
        if (node.elements[i].type === 'TemplateElement') {
          state = seq(state, i > 0 ? t('}') : empty(), elements[i], i < l - 1 ? t('${') : empty());
        } else {
          state = seq(state, elements[i]);
        }
      }
      state = seq(state, t('`'));
      if (node.tag != null) {
        state.startsWithCurly = tag.startsWithCurly;
        state.startsWithLet = tag.startsWithLet;
        state.startsWithLetSquareBracket = tag.startsWithLetSquareBracket;
        state.startsWithFunctionOrClass = tag.startsWithFunctionOrClass;
      }
      return state;
    }
  }, {
    key: 'reduceTemplateElement',
    value: function reduceTemplateElement(node) {
      return new coderep.RawToken(node.rawValue);
    }
  }, {
    key: 'reduceThisExpression',
    value: function reduceThisExpression() /* node */{
      return t('this');
    }
  }, {
    key: 'reduceThrowStatement',
    value: function reduceThrowStatement(node, _ref69) {
      var expression = _ref69.expression;

      return seq(t('throw'), expression, semiOp());
    }
  }, {
    key: 'reduceTryCatchStatement',
    value: function reduceTryCatchStatement(node, _ref70) {
      var body = _ref70.body,
          catchClause = _ref70.catchClause;

      return seq(t('try'), body, catchClause);
    }
  }, {
    key: 'reduceTryFinallyStatement',
    value: function reduceTryFinallyStatement(node, _ref71) {
      var body = _ref71.body,
          catchClause = _ref71.catchClause,
          finalizer = _ref71.finalizer;

      return seq(t('try'), body, catchClause || empty(), t('finally'), finalizer);
    }
  }, {
    key: 'reduceYieldExpression',
    value: function reduceYieldExpression(node, _ref72) {
      var expression = _ref72.expression;

      if (node.expression == null) return t('yield');
      return (0, _objectAssign2.default)(seq(t('yield'), p(node.expression, (0, coderep.getPrecedence)(node), expression)), { containsIn: expression.containsIn });
    }
  }, {
    key: 'reduceYieldGeneratorExpression',
    value: function reduceYieldGeneratorExpression(node, _ref73) {
      var expression = _ref73.expression;

      return (0, _objectAssign2.default)(seq(t('yield'), t('*'), p(node.expression, (0, coderep.getPrecedence)(node), expression)), { containsIn: expression.containsIn });
    }
  }, {
    key: 'reduceDirective',
    value: function reduceDirective(node) {
      var delim = node.rawValue.match(/(^|[^\\])(\\\\)*"/) ? '\'' : '"';
      return seq(t(delim + node.rawValue + delim), semiOp());
    }
  }, {
    key: 'reduceVariableDeclaration',
    value: function reduceVariableDeclaration(node, _ref74) {
      var declarators = _ref74.declarators;

      return seq(t(node.kind), commaSep(declarators));
    }
  }, {
    key: 'reduceVariableDeclarationStatement',
    value: function reduceVariableDeclarationStatement(node, _ref75) {
      var declaration = _ref75.declaration;

      return seq(declaration, semiOp());
    }
  }, {
    key: 'reduceVariableDeclarator',
    value: function reduceVariableDeclarator(node, _ref76) {
      var binding = _ref76.binding,
          init = _ref76.init;

      var containsIn = init && init.containsIn && !init.containsGroup;
      if (init) {
        if (init.containsGroup) {
          init = paren(init);
        } else {
          init = markContainsIn(init);
        }
      }
      return (0, _objectAssign2.default)(init == null ? binding : seq(binding, t('='), init), { containsIn: containsIn });
    }
  }, {
    key: 'reduceWhileStatement',
    value: function reduceWhileStatement(node, _ref77) {
      var test = _ref77.test,
          body = _ref77.body;

      return (0, _objectAssign2.default)(seq(t('while'), paren(test), body), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: 'reduceWithStatement',
    value: function reduceWithStatement(node, _ref78) {
      var object = _ref78.object,
          body = _ref78.body;

      return (0, _objectAssign2.default)(seq(t('with'), paren(object), body), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }]);

  return MinimalCodeGen;
}();

exports.default = MinimalCodeGen;
});

var formattedCodegen = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FormattedCodeGen = exports.ExtensibleCodeGen = exports.Sep = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();



var _objectAssign2 = _interopRequireDefault(objectAssign);





function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var INDENT = '  ';

var Linebreak = function (_CodeRep) {
  _inherits(Linebreak, _CodeRep);

  function Linebreak() {
    _classCallCheck(this, Linebreak);

    var _this = _possibleConstructorReturn(this, (Linebreak.__proto__ || Object.getPrototypeOf(Linebreak)).call(this));

    _this.indentation = 0;
    return _this;
  }

  _createClass(Linebreak, [{
    key: 'emit',
    value: function emit(ts) {
      ts.put('\n');
      for (var i = 0; i < this.indentation; ++i) {
        ts.put(INDENT);
      }
    }
  }]);

  return Linebreak;
}(coderep.CodeRep);

function empty() {
  return new coderep.Empty();
}

function noIn(rep) {
  return new coderep.NoIn(rep);
}

function markContainsIn(state) {
  return state.containsIn ? new coderep.ContainsIn(state) : state;
}

function seq() {
  for (var _len = arguments.length, reps = Array(_len), _key = 0; _key < _len; _key++) {
    reps[_key] = arguments[_key];
  }

  return new coderep.Seq(reps);
}

function isEmpty(codeRep) {
  return codeRep instanceof coderep.Empty || codeRep instanceof Linebreak || codeRep instanceof coderep.Seq && codeRep.children.every(isEmpty);
}

var Sep = {};
var separatorNames = ['ARRAY_EMPTY', 'ARRAY_BEFORE_COMMA', 'ARRAY_AFTER_COMMA', 'SPREAD', 'AWAIT', 'AFTER_FORAWAIT_AWAIT', 'BEFORE_DEFAULT_EQUALS', 'AFTER_DEFAULT_EQUALS', 'REST', 'OBJECT_BEFORE_COMMA', 'OBJECT_AFTER_COMMA', 'BEFORE_PROP', 'AFTER_PROP', 'BEFORE_JUMP_LABEL', 'ARGS_BEFORE_COMMA', 'ARGS_AFTER_COMMA', 'CALL', 'BEFORE_CATCH_BINDING', 'AFTER_CATCH_BINDING', 'BEFORE_CLASS_NAME', 'BEFORE_EXTENDS', 'AFTER_EXTENDS', 'BEFORE_CLASS_DECLARATION_ELEMENTS', 'BEFORE_CLASS_EXPRESSION_ELEMENTS', 'AFTER_STATIC', 'BEFORE_CLASS_ELEMENT', 'AFTER_CLASS_ELEMENT', 'BEFORE_TERNARY_QUESTION', 'AFTER_TERNARY_QUESTION', 'BEFORE_TERNARY_COLON', 'AFTER_TERNARY_COLON', 'COMPUTED_MEMBER_EXPRESSION', 'COMPUTED_MEMBER_ASSIGNMENT_TARGET', 'AFTER_DO', 'BEFORE_DOWHILE_WHILE', 'AFTER_DOWHILE_WHILE', 'AFTER_FORIN_FOR', 'BEFORE_FORIN_IN', 'AFTER_FORIN_FOR', 'BEFORE_FORIN_BODY', 'AFTER_FOROF_FOR', 'BEFORE_FOROF_OF', 'AFTER_FOROF_FOR', 'BEFORE_FOROF_BODY', 'AFTER_FOR_FOR', 'BEFORE_FOR_INIT', 'AFTER_FOR_INIT', 'EMPTY_FOR_INIT', 'BEFORE_FOR_TEST', 'AFTER_FOR_TEST', 'EMPTY_FOR_TEST', 'BEFORE_FOR_UPDATE', 'AFTER_FOR_UPDATE', 'EMPTY_FOR_UPDATE', 'BEFORE_FOR_BODY', 'BEFORE_GENERATOR_STAR', 'AFTER_GENERATOR_STAR', 'BEFORE_FUNCTION_PARAMS', 'BEFORE_FUNCTION_DECLARATION_BODY', 'BEFORE_FUNCTION_EXPRESSION_BODY', 'AFTER_FUNCTION_DIRECTIVES', 'BEFORE_ARROW', 'AFTER_ARROW', 'AFTER_GET', 'BEFORE_GET_PARAMS', 'BEFORE_GET_BODY', 'AFTER_IF', 'AFTER_IF_TEST', 'BEFORE_ELSE', 'AFTER_ELSE', 'PARAMETER_BEFORE_COMMA', 'PARAMETER_AFTER_COMMA', 'NAMED_IMPORT_BEFORE_COMMA', 'NAMED_IMPORT_AFTER_COMMA', 'IMPORT_BEFORE_COMMA', 'IMPORT_AFTER_COMMA', 'BEFORE_IMPORT_BINDINGS', 'BEFORE_IMPORT_MODULE', 'AFTER_IMPORT_BINDINGS', 'AFTER_FROM', 'BEFORE_IMPORT_NAMESPACE', 'BEFORE_IMPORT_STAR', 'AFTER_IMPORT_STAR', 'AFTER_IMPORT_AS', 'AFTER_NAMESPACE_BINDING', 'BEFORE_IMPORT_AS', 'AFTER_IMPORT_AS', 'EXPORTS_BEFORE_COMMA', 'EXPORTS_AFTER_COMMA', 'BEFORE_EXPORT_STAR', 'AFTER_EXPORT_STAR', 'BEFORE_EXPORT_BINDINGS', 'AFTER_EXPORT_FROM_BINDINGS', 'AFTER_EXPORT_LOCAL_BINDINGS', 'AFTER_EXPORT', 'EXPORT_DEFAULT', 'AFTER_EXPORT_DEFAULT', 'BEFORE_EXPORT_AS', 'AFTER_EXPORT_AS', 'BEFORE_LABEL_COLON', 'AFTER_LABEL_COLON', 'AFTER_METHOD_GENERATOR_STAR', 'AFTER_METHOD_ASYNC', 'AFTER_METHOD_NAME', 'BEFORE_METHOD_BODY', 'AFTER_MODULE_DIRECTIVES', 'AFTER_NEW', 'BEFORE_NEW_ARGS', 'EMPTY_NEW_CALL', 'NEW_TARGET_BEFORE_DOT', 'NEW_TARGET_AFTER_DOT', 'RETURN', 'AFTER_SET', 'BEFORE_SET_PARAMS', 'BEFORE_SET_BODY', 'AFTER_SCRIPT_DIRECTIVES', 'BEFORE_STATIC_MEMBER_DOT', 'AFTER_STATIC_MEMBER_DOT', 'BEFORE_STATIC_MEMBER_ASSIGNMENT_TARGET_DOT', 'AFTER_STATIC_MEMBER_ASSIGNMENT_TARGET_DOT', 'BEFORE_CASE_TEST', 'AFTER_CASE_TEST', 'BEFORE_CASE_BODY', 'AFTER_CASE_BODY', 'DEFAULT', 'AFTER_DEFAULT_BODY', 'BEFORE_SWITCH_DISCRIM', 'BEFORE_SWITCH_BODY', 'TEMPLATE_TAG', 'BEFORE_TEMPLATE_EXPRESSION', 'AFTER_TEMPLATE_EXPRESSION', 'THROW', 'AFTER_TRY', 'BEFORE_CATCH', 'BEFORE_FINALLY', 'AFTER_FINALLY', 'VARIABLE_DECLARATION', 'YIELD', 'BEFORE_YIELD_STAR', 'AFTER_YIELD_STAR', 'DECLARATORS_BEFORE_COMMA', 'DECLARATORS_AFTER_COMMA', 'BEFORE_INIT_EQUALS', 'AFTER_INIT_EQUALS', 'AFTER_WHILE', 'BEFORE_WHILE_BODY', 'AFTER_WITH', 'BEFORE_WITH_BODY', 'PAREN_AVOIDING_DIRECTIVE_BEFORE', 'PAREN_AVOIDING_DIRECTIVE_AFTER', 'PRECEDENCE_BEFORE', 'PRECEDENCE_AFTER', 'EXPRESSION_PAREN_BEFORE', 'EXPRESSION_PAREN_AFTER', 'CALL_PAREN_BEFORE', 'CALL_PAREN_AFTER', 'CALL_PAREN_EMPTY', 'CATCH_PAREN_BEFORE', 'CATCH_PAREN_AFTER', 'DO_WHILE_TEST_PAREN_BEFORE', 'DO_WHILE_TEST_PAREN_AFTER', 'EXPRESSION_STATEMENT_PAREN_BEFORE', 'EXPRESSION_STATEMENT_PAREN_AFTER', 'FOR_LET_PAREN_BEFORE', 'FOR_LET_PAREN_AFTER', 'FOR_IN_LET_PAREN_BEFORE', 'FOR_IN_LET_PAREN_AFTER', 'FOR_IN_PAREN_BEFORE', 'FOR_IN_PAREN_AFTER', 'FOR_OF_LET_PAREN_BEFORE', 'FOR_OF_LET_PAREN_AFTER', 'FOR_OF_PAREN_BEFORE', 'FOR_OF_PAREN_AFTER', 'PARAMETERS_PAREN_BEFORE', 'PARAMETERS_PAREN_AFTER', 'PARAMETERS_PAREN_EMPTY', 'ARROW_PARAMETERS_PAREN_BEFORE', 'ARROW_PARAMETERS_PAREN_AFTER', 'ARROW_PARAMETERS_PAREN_EMPTY', 'ARROW_BODY_PAREN_BEFORE', 'ARROW_BODY_PAREN_AFTER', 'BEFORE_ARROW_ASYNC_PARAMS', 'GETTER_PARAMS', 'IF_PAREN_BEFORE', 'IF_PAREN_AFTER', 'EXPORT_PAREN_BEFORE', 'EXPORT_PAREN_AFTER', 'NEW_CALLEE_PAREN_BEFORE', 'NEW_CALLEE_PAREN_AFTER', 'NEW_PAREN_BEFORE', 'NEW_PAREN_AFTER', 'NEW_PAREN_EMPTY', 'SETTER_PARAM_BEFORE', 'SETTER_PARAM_AFTER', 'SWITCH_DISCRIM_PAREN_BEFORE', 'SWITCH_DISCRIM_PAREN_AFTER', 'WHILE_TEST_PAREN_BEFORE', 'WHILE_TEST_PAREN_AFTER', 'WITH_PAREN_BEFORE', 'WITH_PAREN_AFTER', 'OBJECT_BRACE_INITIAL', 'OBJECT_BRACE_FINAL', 'OBJECT_EMPTY', 'BLOCK_BRACE_INITIAL', 'BLOCK_BRACE_FINAL', 'BLOCK_EMPTY', 'CLASS_BRACE_INITIAL', 'CLASS_BRACE_FINAL', 'CLASS_EMPTY', 'CLASS_EXPRESSION_BRACE_INITIAL', 'CLASS_EXPRESSION_BRACE_FINAL', 'CLASS_EXPRESSION_BRACE_EMPTY', 'FUNCTION_BRACE_INITIAL', 'FUNCTION_BRACE_FINAL', 'FUNCTION_EMPTY', 'FUNCTION_EXPRESSION_BRACE_INITIAL', 'FUNCTION_EXPRESSION_BRACE_FINAL', 'FUNCTION_EXPRESSION_EMPTY', 'ARROW_BRACE_INITIAL', 'ARROW_BRACE_FINAL', 'ARROW_BRACE_EMPTY', 'GET_BRACE_INTIAL', 'GET_BRACE_FINAL', 'GET_BRACE_EMPTY', 'MISSING_ELSE_INTIIAL', 'MISSING_ELSE_FINAL', 'MISSING_ELSE_EMPTY', 'IMPORT_BRACE_INTIAL', 'IMPORT_BRACE_FINAL', 'IMPORT_BRACE_EMPTY', 'EXPORT_BRACE_INITIAL', 'EXPORT_BRACE_FINAL', 'EXPORT_BRACE_EMPTY', 'METHOD_BRACE_INTIAL', 'METHOD_BRACE_FINAL', 'METHOD_BRACE_EMPTY', 'SET_BRACE_INTIIAL', 'SET_BRACE_FINAL', 'SET_BRACE_EMPTY', 'SWITCH_BRACE_INTIAL', 'SWITCH_BRACE_FINAL', 'SWITCH_BRACE_EMPTY', 'ARRAY_INITIAL', 'ARRAY_FINAL', 'COMPUTED_MEMBER_BRACKET_INTIAL', 'COMPUTED_MEMBER_BRACKET_FINAL', 'COMPUTED_MEMBER_ASSIGNMENT_TARGET_BRACKET_INTIAL', 'COMPUTED_MEMBER_ASSIGNMENT_TARGET_BRACKET_FINAL', 'COMPUTED_PROPERTY_BRACKET_INTIAL', 'COMPUTED_PROPERTY_BRACKET_FINAL'];
for (var i = 0; i < separatorNames.length; ++i) {
  Sep[separatorNames[i]] = { type: separatorNames[i] };
}

Sep.BEFORE_ASSIGN_OP = function (op) {
  return {
    type: 'BEFORE_ASSIGN_OP',
    op: op
  };
};

Sep.AFTER_ASSIGN_OP = function (op) {
  return {
    type: 'AFTER_ASSIGN_OP',
    op: op
  };
};

Sep.BEFORE_BINOP = function (op) {
  return {
    type: 'BEFORE_BINOP',
    op: op
  };
};

Sep.AFTER_BINOP = function (op) {
  return {
    type: 'AFTER_BINOP',
    op: op
  };
};

Sep.BEFORE_POSTFIX = function (op) {
  return {
    type: 'BEFORE_POSTFIX',
    op: op
  };
};

Sep.UNARY = function (op) {
  return {
    type: 'UNARY',
    op: op
  };
};

Sep.AFTER_STATEMENT = function (node) {
  return {
    type: 'AFTER_STATEMENT',
    node: node
  };
};

Sep.BEFORE_FUNCTION_NAME = function (node) {
  return {
    type: 'BEFORE_FUNCTION_NAME',
    node: node
  };
};
exports.Sep = Sep;

var ExtensibleCodeGen = exports.ExtensibleCodeGen = function () {
  function ExtensibleCodeGen() {
    _classCallCheck(this, ExtensibleCodeGen);
  }

  _createClass(ExtensibleCodeGen, [{
    key: 'parenToAvoidBeingDirective',
    value: function parenToAvoidBeingDirective(element, original) {
      if (element && element.type === 'ExpressionStatement' && element.expression.type === 'LiteralStringExpression') {
        return seq(this.paren(original.children[0], Sep.PAREN_AVOIDING_DIRECTIVE_BEFORE, Sep.PAREN_AVOIDING_DIRECTIVE_AFTER), this.semiOp());
      }
      return original;
    }
  }, {
    key: 't',
    value: function t(token) {
      var isRegExp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return new coderep.Token(token, isRegExp);
    }
  }, {
    key: 'p',
    value: function p(node, precedence, a) {
      return (0, coderep.getPrecedence)(node) < precedence ? this.paren(a, Sep.PRECEDENCE_BEFORE, Sep.PRECEDENCE_AFTER) : a;
    }
  }, {
    key: 'getAssignmentExpr',
    value: function getAssignmentExpr(state) {
      return state ? state.containsGroup ? this.paren(state, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER) : state : empty();
    }
  }, {
    key: 'paren',
    value: function paren(rep, first, last, emptySep) {
      if (isEmpty(rep)) {
        return new coderep.Paren(this.sep(emptySep));
      }
      return new coderep.Paren(seq(first ? this.sep(first) : empty(), rep, last ? this.sep(last) : empty()));
    }
  }, {
    key: 'brace',
    value: function brace(rep, node, first, last, emptySep) {
      if (isEmpty(rep)) {
        return new coderep.Brace(this.sep(emptySep));
      }
      return new coderep.Brace(seq(this.sep(first), rep, this.sep(last)));
    }
  }, {
    key: 'bracket',
    value: function bracket(rep, first, last, emptySep) {
      if (isEmpty(rep)) {
        return new coderep.Bracket(this.sep(emptySep));
      }
      return new coderep.Bracket(seq(this.sep(first), rep, this.sep(last)));
    }
  }, {
    key: 'commaSep',
    value: function commaSep(pieces, before, after) {
      var _this2 = this;

      var first = true;
      pieces = pieces.map(function (p) {
        if (first) {
          first = false;
          return p;
        }
        return seq(_this2.sep(before), _this2.t(','), _this2.sep(after), p);
      });
      return seq.apply(undefined, _toConsumableArray(pieces));
    }
  }, {
    key: 'semiOp',
    value: function semiOp() {
      return new coderep.SemiOp();
    }
  }, {
    key: 'sep',
    value: function sep() /* kind */{
      return empty();
    }
  }, {
    key: 'reduceArrayExpression',
    value: function reduceArrayExpression(node, _ref) {
      var _this3 = this;

      var elements = _ref.elements;

      if (elements.length === 0) {
        return this.bracket(empty(), null, null, Sep.ARRAY_EMPTY);
      }

      var content = this.commaSep(elements.map(function (e) {
        return _this3.getAssignmentExpr(e);
      }), Sep.ARRAY_BEFORE_COMMA, Sep.ARRAY_AFTER_COMMA);
      if (elements.length > 0 && elements[elements.length - 1] == null) {
        content = seq(content, this.sep(Sep.ARRAY_BEFORE_COMMA), this.t(','), this.sep(Sep.ARRAY_AFTER_COMMA));
      }
      return this.bracket(content, Sep.ARRAY_INITIAL, Sep.ARRAY_FINAL);
    }
  }, {
    key: 'reduceAwaitExpression',
    value: function reduceAwaitExpression(node, _ref2) {
      var expression = _ref2.expression;

      return seq(this.t('await'), this.sep(Sep.AWAIT), this.p(node.expression, (0, coderep.getPrecedence)(node), expression));
    }
  }, {
    key: 'reduceSpreadElement',
    value: function reduceSpreadElement(node, _ref3) {
      var expression = _ref3.expression;

      return seq(this.t('...'), this.sep(Sep.SPREAD), this.p(node.expression, coderep.Precedence.Assignment, expression));
    }
  }, {
    key: 'reduceSpreadProperty',
    value: function reduceSpreadProperty(node, _ref4) {
      var expression = _ref4.expression;

      return seq(this.t('...'), this.sep(Sep.SPREAD), this.getAssignmentExpr(expression));
    }
  }, {
    key: 'reduceAssignmentExpression',
    value: function reduceAssignmentExpression(node, _ref5) {
      var binding = _ref5.binding,
          expression = _ref5.expression;

      var leftCode = binding;
      var rightCode = expression;
      var containsIn = expression.containsIn;
      var startsWithCurly = binding.startsWithCurly;
      var startsWithLetSquareBracket = binding.startsWithLetSquareBracket;
      var startsWithFunctionOrClass = binding.startsWithFunctionOrClass;
      if ((0, coderep.getPrecedence)(node.expression) < (0, coderep.getPrecedence)(node)) {
        rightCode = this.paren(rightCode, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
        containsIn = false;
      }
      return (0, _objectAssign2.default)(seq(leftCode, this.sep(Sep.BEFORE_ASSIGN_OP('=')), this.t('='), this.sep(Sep.AFTER_ASSIGN_OP('=')), rightCode), { containsIn: containsIn, startsWithCurly: startsWithCurly, startsWithLetSquareBracket: startsWithLetSquareBracket, startsWithFunctionOrClass: startsWithFunctionOrClass });
    }
  }, {
    key: 'reduceAssignmentTargetIdentifier',
    value: function reduceAssignmentTargetIdentifier(node) {
      var a = this.t(node.name);
      if (node.name === 'let') {
        a.startsWithLet = true;
      }
      return a;
    }
  }, {
    key: 'reduceAssignmentTargetWithDefault',
    value: function reduceAssignmentTargetWithDefault(node, _ref6) {
      var binding = _ref6.binding,
          init = _ref6.init;

      return seq(binding, this.sep(Sep.BEFORE_DEFAULT_EQUALS), this.t('='), this.sep(Sep.AFTER_DEFAULT_EQUALS), this.p(node.init, coderep.Precedence.Assignment, init));
    }
  }, {
    key: 'reduceCompoundAssignmentExpression',
    value: function reduceCompoundAssignmentExpression(node, _ref7) {
      var binding = _ref7.binding,
          expression = _ref7.expression;

      var leftCode = binding;
      var rightCode = expression;
      var containsIn = expression.containsIn;
      var startsWithCurly = binding.startsWithCurly;
      var startsWithLetSquareBracket = binding.startsWithLetSquareBracket;
      var startsWithFunctionOrClass = binding.startsWithFunctionOrClass;
      if ((0, coderep.getPrecedence)(node.expression) < (0, coderep.getPrecedence)(node)) {
        rightCode = this.paren(rightCode, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
        containsIn = false;
      }
      return (0, _objectAssign2.default)(seq(leftCode, this.sep(Sep.BEFORE_ASSIGN_OP(node.operator)), this.t(node.operator), this.sep(Sep.AFTER_ASSIGN_OP(node.operator)), rightCode), { containsIn: containsIn, startsWithCurly: startsWithCurly, startsWithLetSquareBracket: startsWithLetSquareBracket, startsWithFunctionOrClass: startsWithFunctionOrClass });
    }
  }, {
    key: 'reduceBinaryExpression',
    value: function reduceBinaryExpression(node, _ref8) {
      var left = _ref8.left,
          right = _ref8.right;

      var leftCode = left;
      var startsWithCurly = left.startsWithCurly;
      var startsWithLetSquareBracket = left.startsWithLetSquareBracket;
      var startsWithFunctionOrClass = left.startsWithFunctionOrClass;
      var leftContainsIn = left.containsIn;
      var isRightAssociative = node.operator === '**';
      if ((0, coderep.getPrecedence)(node.left) < (0, coderep.getPrecedence)(node) || isRightAssociative && ((0, coderep.getPrecedence)(node.left) === (0, coderep.getPrecedence)(node) || node.left.type === 'UnaryExpression')) {
        leftCode = this.paren(leftCode, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
        startsWithCurly = false;
        startsWithLetSquareBracket = false;
        startsWithFunctionOrClass = false;
        leftContainsIn = false;
      }
      var rightCode = right;
      var rightContainsIn = right.containsIn;
      if ((0, coderep.getPrecedence)(node.right) < (0, coderep.getPrecedence)(node) || !isRightAssociative && (0, coderep.getPrecedence)(node.right) === (0, coderep.getPrecedence)(node)) {
        rightCode = this.paren(rightCode, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
        rightContainsIn = false;
      }
      return (0, _objectAssign2.default)(seq(leftCode, this.sep(Sep.BEFORE_BINOP(node.operator)), this.t(node.operator), this.sep(Sep.AFTER_BINOP(node.operator)), rightCode), {
        containsIn: leftContainsIn || rightContainsIn || node.operator === 'in',
        containsGroup: node.operator === ',',
        startsWithCurly: startsWithCurly,
        startsWithLetSquareBracket: startsWithLetSquareBracket,
        startsWithFunctionOrClass: startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceBindingWithDefault',
    value: function reduceBindingWithDefault(node, _ref9) {
      var binding = _ref9.binding,
          init = _ref9.init;

      return seq(binding, this.sep(Sep.BEFORE_DEFAULT_EQUALS), this.t('='), this.sep(Sep.AFTER_DEFAULT_EQUALS), this.p(node.init, coderep.Precedence.Assignment, init));
    }
  }, {
    key: 'reduceBindingIdentifier',
    value: function reduceBindingIdentifier(node) {
      var a = this.t(node.name);
      if (node.name === 'let') {
        a.startsWithLet = true;
      }
      return a;
    }
  }, {
    key: 'reduceArrayAssignmentTarget',
    value: function reduceArrayAssignmentTarget(node, _ref10) {
      var _this4 = this;

      var elements = _ref10.elements,
          rest = _ref10.rest;

      var content = void 0;
      if (elements.length === 0) {
        content = rest == null ? empty() : seq(this.t('...'), this.sep(Sep.REST), rest);
      } else {
        elements = elements.concat(rest == null ? [] : [seq(this.t('...'), this.sep(Sep.REST), rest)]);
        content = this.commaSep(elements.map(function (e) {
          return _this4.getAssignmentExpr(e);
        }), Sep.ARRAY_BEFORE_COMMA, Sep.ARRAY_AFTER_COMMA);
        if (elements.length > 0 && elements[elements.length - 1] == null) {
          content = seq(content, this.sep(Sep.ARRAY_BEFORE_COMMA), this.t(','), this.sep(Sep.ARRAY_AFTER_COMMA));
        }
      }
      return this.bracket(content, Sep.ARRAY_INITIAL, Sep.ARRAY_FINAL, Sep.ARRAY_EMPTY);
    }
  }, {
    key: 'reduceArrayBinding',
    value: function reduceArrayBinding(node, _ref11) {
      var _this5 = this;

      var elements = _ref11.elements,
          rest = _ref11.rest;

      var content = void 0;
      if (elements.length === 0) {
        content = rest == null ? empty() : seq(this.t('...'), this.sep(Sep.REST), rest);
      } else {
        elements = elements.concat(rest == null ? [] : [seq(this.t('...'), this.sep(Sep.REST), rest)]);
        content = this.commaSep(elements.map(function (e) {
          return _this5.getAssignmentExpr(e);
        }), Sep.ARRAY_BEFORE_COMMA, Sep.ARRAY_AFTER_COMMA);
        if (elements.length > 0 && elements[elements.length - 1] == null) {
          content = seq(content, this.sep(Sep.ARRAY_BEFORE_COMMA), this.t(','), this.sep(Sep.ARRAY_AFTER_COMMA));
        }
      }
      return this.bracket(content, Sep.ARRAY_INITIAL, Sep.ARRAY_FINAL, Sep.ARRAY_EMPTY);
    }
  }, {
    key: 'reduceObjectAssignmentTarget',
    value: function reduceObjectAssignmentTarget(node, _ref12) {
      var properties = _ref12.properties,
          rest = _ref12.rest;

      var content = void 0;
      if (properties.length === 0) {
        content = rest == null ? empty() : seq(this.t('...'), this.sep(Sep.REST), rest);
      } else {
        content = this.commaSep(properties, Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA);
        content = rest == null ? content : this.commaSep([content, seq(this.t('...'), this.sep(Sep.REST), rest)], Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA);
      }
      var state = this.brace(content, node, Sep.OBJECT_BRACE_INITIAL, Sep.OBJECT_BRACE_FINAL, Sep.OBJECT_EMPTY);
      state.startsWithCurly = true;
      return state;
    }
  }, {
    key: 'reduceObjectBinding',
    value: function reduceObjectBinding(node, _ref13) {
      var properties = _ref13.properties,
          rest = _ref13.rest;

      var content = void 0;
      if (properties.length === 0) {
        content = rest == null ? empty() : seq(this.t('...'), this.sep(Sep.REST), rest);
      } else {
        content = this.commaSep(properties, Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA);
        content = rest == null ? content : this.commaSep([content, seq(this.t('...'), this.sep(Sep.REST), rest)], Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA);
      }
      var state = this.brace(content, node, Sep.OBJECT_BRACE_INITIAL, Sep.OBJECT_BRACE_FINAL, Sep.OBJECT_EMPTY);
      state.startsWithCurly = true;
      return state;
    }
  }, {
    key: 'reduceAssignmentTargetPropertyIdentifier',
    value: function reduceAssignmentTargetPropertyIdentifier(node, _ref14) {
      var binding = _ref14.binding,
          init = _ref14.init;

      if (node.init == null) return binding;
      return seq(binding, this.sep(Sep.BEFORE_DEFAULT_EQUALS), this.t('='), this.sep(Sep.AFTER_DEFAULT_EQUALS), this.p(node.init, coderep.Precedence.Assignment, init));
    }
  }, {
    key: 'reduceAssignmentTargetPropertyProperty',
    value: function reduceAssignmentTargetPropertyProperty(node, _ref15) {
      var name = _ref15.name,
          binding = _ref15.binding;

      return seq(name, this.sep(Sep.BEFORE_PROP), this.t(':'), this.sep(Sep.AFTER_PROP), binding);
    }
  }, {
    key: 'reduceBindingPropertyIdentifier',
    value: function reduceBindingPropertyIdentifier(node, _ref16) {
      var binding = _ref16.binding,
          init = _ref16.init;

      if (node.init == null) return binding;
      return seq(binding, this.sep(Sep.BEFORE_DEFAULT_EQUALS), this.t('='), this.sep(Sep.AFTER_DEFAULT_EQUALS), this.p(node.init, coderep.Precedence.Assignment, init));
    }
  }, {
    key: 'reduceBindingPropertyProperty',
    value: function reduceBindingPropertyProperty(node, _ref17) {
      var name = _ref17.name,
          binding = _ref17.binding;

      return seq(name, this.sep(Sep.BEFORE_PROP), this.t(':'), this.sep(Sep.AFTER_PROP), binding);
    }
  }, {
    key: 'reduceBlock',
    value: function reduceBlock(node, _ref18) {
      var statements = _ref18.statements;

      return this.brace(seq.apply(undefined, _toConsumableArray(statements)), node, Sep.BLOCK_BRACE_INITIAL, Sep.BLOCK_BRACE_FINAL, Sep.BLOCK_EMPTY);
    }
  }, {
    key: 'reduceBlockStatement',
    value: function reduceBlockStatement(node, _ref19) {
      var block = _ref19.block;

      return seq(block, this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceBreakStatement',
    value: function reduceBreakStatement(node) {
      return seq(this.t('break'), node.label ? seq(this.sep(Sep.BEFORE_JUMP_LABEL), this.t(node.label)) : empty(), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceCallExpression',
    value: function reduceCallExpression(node, _ref20) {
      var _this6 = this;

      var callee = _ref20.callee,
          args = _ref20.arguments;

      var parenthizedArgs = args.map(function (a, i) {
        return _this6.p(node.arguments[i], coderep.Precedence.Assignment, a);
      });
      return (0, _objectAssign2.default)(seq(this.p(node.callee, (0, coderep.getPrecedence)(node), callee), this.sep(Sep.CALL), this.paren(this.commaSep(parenthizedArgs, Sep.ARGS_BEFORE_COMMA, Sep.ARGS_AFTER_COMMA), Sep.CALL_PAREN_BEFORE, Sep.CALL_PAREN_AFTER, Sep.CALL_PAREN_EMPTY)), {
        startsWithCurly: callee.startsWithCurly,
        startsWithLet: callee.startsWithLet,
        startsWithLetSquareBracket: callee.startsWithLetSquareBracket,
        startsWithFunctionOrClass: callee.startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceCatchClause',
    value: function reduceCatchClause(node, _ref21) {
      var binding = _ref21.binding,
          body = _ref21.body;

      return seq(this.t('catch'), this.sep(Sep.BEFORE_CATCH_BINDING), this.paren(binding, Sep.CATCH_PAREN_BEFORE, Sep.CATCH_PAREN_AFTER), this.sep(Sep.AFTER_CATCH_BINDING), body);
    }
  }, {
    key: 'reduceClassDeclaration',
    value: function reduceClassDeclaration(node, _ref22) {
      var name = _ref22.name,
          _super = _ref22.super,
          elements = _ref22.elements;

      var state = seq(this.t('class'), node.name.name === '*default*' ? empty() : seq(this.sep(Sep.BEFORE_CLASS_NAME), name));
      if (_super != null) {
        state = seq(state, this.sep(Sep.BEFORE_EXTENDS), this.t('extends'), this.sep(Sep.AFTER_EXTENDS), this.p(node.super, coderep.Precedence.New, _super));
      }
      state = seq(state, this.sep(Sep.BEFORE_CLASS_DECLARATION_ELEMENTS), this.brace(seq.apply(undefined, _toConsumableArray(elements)), node, Sep.CLASS_BRACE_INITIAL, Sep.CLASS_BRACE_FINAL, Sep.CLASS_EMPTY), this.sep(Sep.AFTER_STATEMENT(node)));
      return state;
    }
  }, {
    key: 'reduceClassExpression',
    value: function reduceClassExpression(node, _ref23) {
      var name = _ref23.name,
          _super = _ref23.super,
          elements = _ref23.elements;

      var state = this.t('class');
      if (name != null) {
        state = seq(state, this.sep(Sep.BEFORE_CLASS_NAME), name);
      }
      if (_super != null) {
        state = seq(state, this.sep(Sep.BEFORE_EXTENDS), this.t('extends'), this.sep(Sep.AFTER_EXTENDS), this.p(node.super, coderep.Precedence.New, _super));
      }
      state = seq(state, this.sep(Sep.BEFORE_CLASS_EXPRESSION_ELEMENTS), this.brace(seq.apply(undefined, _toConsumableArray(elements)), node, Sep.CLASS_EXPRESSION_BRACE_INITIAL, Sep.CLASS_EXPRESSION_BRACE_FINAL, Sep.CLASS_EXPRESSION_BRACE_EMPTY));
      state.startsWithFunctionOrClass = true;
      return state;
    }
  }, {
    key: 'reduceClassElement',
    value: function reduceClassElement(node, _ref24) {
      var method = _ref24.method;

      method = seq(this.sep(Sep.BEFORE_CLASS_ELEMENT), method, this.sep(Sep.AFTER_CLASS_ELEMENT));
      if (!node.isStatic) return method;
      return seq(this.t('static'), this.sep(Sep.AFTER_STATIC), method);
    }
  }, {
    key: 'reduceComputedMemberAssignmentTarget',
    value: function reduceComputedMemberAssignmentTarget(node, _ref25) {
      var object = _ref25.object,
          expression = _ref25.expression;

      var startsWithLetSquareBracket = object.startsWithLetSquareBracket || node.object.type === 'IdentifierExpression' && node.object.name === 'let';
      return (0, _objectAssign2.default)(seq(this.p(node.object, (0, coderep.getPrecedence)(node), object), this.sep(Sep.COMPUTED_MEMBER_ASSIGNMENT_TARGET), this.bracket(expression, Sep.COMPUTED_MEMBER_ASSIGNMENT_TARGET_BRACKET_INTIAL, Sep.COMPUTED_MEMBER_ASSIGNMENT_TARGET_BRACKET_FINAL)), {
        startsWithLet: object.startsWithLet,
        startsWithLetSquareBracket: startsWithLetSquareBracket,
        startsWithCurly: object.startsWithCurly,
        startsWithFunctionOrClass: object.startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceComputedMemberExpression',
    value: function reduceComputedMemberExpression(node, _ref26) {
      var object = _ref26.object,
          expression = _ref26.expression;

      var startsWithLetSquareBracket = object.startsWithLetSquareBracket || node.object.type === 'IdentifierExpression' && node.object.name === 'let';
      return (0, _objectAssign2.default)(seq(this.p(node.object, (0, coderep.getPrecedence)(node), object), this.sep(Sep.COMPUTED_MEMBER_EXPRESSION), this.bracket(expression, Sep.COMPUTED_MEMBER_BRACKET_INTIAL, Sep.COMPUTED_MEMBER_BRACKET_FINAL)), {
        startsWithLet: object.startsWithLet,
        startsWithLetSquareBracket: startsWithLetSquareBracket,
        startsWithCurly: object.startsWithCurly,
        startsWithFunctionOrClass: object.startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceComputedPropertyName',
    value: function reduceComputedPropertyName(node, _ref27) {
      var expression = _ref27.expression;

      return this.bracket(this.p(node.expression, coderep.Precedence.Assignment, expression), Sep.COMPUTED_PROPERTY_BRACKET_INTIAL, Sep.COMPUTED_PROPERTY_BRACKET_FINAL);
    }
  }, {
    key: 'reduceConditionalExpression',
    value: function reduceConditionalExpression(node, _ref28) {
      var test = _ref28.test,
          consequent = _ref28.consequent,
          alternate = _ref28.alternate;

      var containsIn = test.containsIn || alternate.containsIn;
      var startsWithCurly = test.startsWithCurly;
      var startsWithLetSquareBracket = test.startsWithLetSquareBracket;
      var startsWithFunctionOrClass = test.startsWithFunctionOrClass;
      return (0, _objectAssign2.default)(seq(this.p(node.test, coderep.Precedence.LogicalOR, test), this.sep(Sep.BEFORE_TERNARY_QUESTION), this.t('?'), this.sep(Sep.AFTER_TERNARY_QUESTION), this.p(node.consequent, coderep.Precedence.Assignment, consequent), this.sep(Sep.BEFORE_TERNARY_COLON), this.t(':'), this.sep(Sep.AFTER_TERNARY_COLON), this.p(node.alternate, coderep.Precedence.Assignment, alternate)), {
        containsIn: containsIn,
        startsWithCurly: startsWithCurly,
        startsWithLetSquareBracket: startsWithLetSquareBracket,
        startsWithFunctionOrClass: startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceContinueStatement',
    value: function reduceContinueStatement(node) {
      return seq(this.t('continue'), node.label ? seq(this.sep(Sep.BEFORE_JUMP_LABEL), this.t(node.label)) : empty(), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceDataProperty',
    value: function reduceDataProperty(node, _ref29) {
      var name = _ref29.name,
          expression = _ref29.expression;

      return seq(name, this.sep(Sep.BEFORE_PROP), this.t(':'), this.sep(Sep.AFTER_PROP), this.getAssignmentExpr(expression));
    }
  }, {
    key: 'reduceDebuggerStatement',
    value: function reduceDebuggerStatement(node) {
      return seq(this.t('debugger'), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceDoWhileStatement',
    value: function reduceDoWhileStatement(node, _ref30) {
      var body = _ref30.body,
          test = _ref30.test;

      return seq(this.t('do'), this.sep(Sep.AFTER_DO), body, this.sep(Sep.BEFORE_DOWHILE_WHILE), this.t('while'), this.sep(Sep.AFTER_DOWHILE_WHILE), this.paren(test, Sep.DO_WHILE_TEST_PAREN_BEFORE, Sep.DO_WHILE_TEST_PAREN_AFTER), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceEmptyStatement',
    value: function reduceEmptyStatement(node) {
      return seq(this.t(';'), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceExpressionStatement',
    value: function reduceExpressionStatement(node, _ref31) {
      var expression = _ref31.expression;

      var needsParens = expression.startsWithCurly || expression.startsWithLetSquareBracket || expression.startsWithFunctionOrClass;
      return seq(needsParens ? this.paren(expression, Sep.EXPRESSION_STATEMENT_PAREN_BEFORE, Sep.EXPRESSION_STATEMENT_PAREN_AFTER) : expression, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceForInStatement',
    value: function reduceForInStatement(node, _ref32) {
      var left = _ref32.left,
          right = _ref32.right,
          body = _ref32.body;

      left = node.left.type === 'VariableDeclaration' ? noIn(markContainsIn(left)) : left;
      return (0, _objectAssign2.default)(seq(this.t('for'), this.sep(Sep.AFTER_FORIN_FOR), this.paren(seq(left.startsWithLet ? this.paren(left, Sep.FOR_IN_LET_PAREN_BEFORE, Sep.FOR_IN_LET_PAREN_AFTER) : left, this.sep(Sep.BEFORE_FORIN_IN), this.t('in'), this.sep(Sep.AFTER_FORIN_FOR), right), Sep.FOR_IN_PAREN_BEFORE, Sep.FOR_IN_PAREN_AFTER), this.sep(Sep.BEFORE_FORIN_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: 'reduceForOfStatement',
    value: function reduceForOfStatement(node, _ref33) {
      var left = _ref33.left,
          right = _ref33.right,
          body = _ref33.body;

      left = node.left.type === 'VariableDeclaration' ? noIn(markContainsIn(left)) : left;
      return (0, _objectAssign2.default)(seq(this.t('for'), this.sep(Sep.AFTER_FOROF_FOR), this.paren(seq(left.startsWithLet ? this.paren(left, Sep.FOR_OF_LET_PAREN_BEFORE, Sep.FOR_OF_LET_PAREN_AFTER) : left, this.sep(Sep.BEFORE_FOROF_OF), this.t('of'), this.sep(Sep.AFTER_FOROF_FOR), this.p(node.right, coderep.Precedence.Assignment, right)), Sep.FOR_OF_PAREN_BEFORE, Sep.FOR_OF_PAREN_AFTER), this.sep(Sep.BEFORE_FOROF_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: 'reduceForStatement',
    value: function reduceForStatement(node, _ref34) {
      var init = _ref34.init,
          test = _ref34.test,
          update = _ref34.update,
          body = _ref34.body;

      if (init) {
        if (init.startsWithLetSquareBracket) {
          init = this.paren(init, Sep.FOR_LET_PAREN_BEFORE, Sep.FOR_LET_PAREN_AFTER);
        }
        init = noIn(markContainsIn(init));
      }
      return (0, _objectAssign2.default)(seq(this.t('for'), this.sep(Sep.AFTER_FOR_FOR), this.paren(seq(init ? seq(this.sep(Sep.BEFORE_FOR_INIT), init, this.sep(Sep.AFTER_FOR_INIT)) : this.sep(Sep.EMPTY_FOR_INIT), this.t(';'), test ? seq(this.sep(Sep.BEFORE_FOR_TEST), test, this.sep(Sep.AFTER_FOR_TEST)) : this.sep(Sep.EMPTY_FOR_TEST), this.t(';'), update ? seq(this.sep(Sep.BEFORE_FOR_UPDATE), update, this.sep(Sep.AFTER_FOR_UPDATE)) : this.sep(Sep.EMPTY_FOR_UPDATE))), this.sep(Sep.BEFORE_FOR_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))), {
        endsWithMissingElse: body.endsWithMissingElse
      });
    }
  }, {
    key: 'reduceForAwaitStatement',
    value: function reduceForAwaitStatement(node, _ref35) {
      var left = _ref35.left,
          right = _ref35.right,
          body = _ref35.body;

      left = node.left.type === 'VariableDeclaration' ? noIn(markContainsIn(left)) : left;
      return (0, _objectAssign2.default)(seq(this.t('for'), this.sep(Sep.AFTER_FOROF_FOR), this.t('await'), this.sep(Sep.AFTER_FORAWAIT_AWAIT), this.paren(seq(left.startsWithLet ? this.paren(left, Sep.FOR_OF_LET_PAREN_BEFORE, Sep.FOR_OF_LET_PAREN_AFTER) : left, this.sep(Sep.BEFORE_FOROF_OF), this.t('of'), this.sep(Sep.AFTER_FOROF_FOR), this.p(node.right, coderep.Precedence.Assignment, right)), Sep.FOR_OF_PAREN_BEFORE, Sep.FOR_OF_PAREN_AFTER), this.sep(Sep.BEFORE_FOROF_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: 'reduceFunctionBody',
    value: function reduceFunctionBody(node, _ref36) {
      var directives = _ref36.directives,
          statements = _ref36.statements;

      if (statements.length) {
        statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
      }
      return seq.apply(undefined, _toConsumableArray(directives).concat([directives.length ? this.sep(Sep.AFTER_FUNCTION_DIRECTIVES) : empty()], _toConsumableArray(statements)));
    }
  }, {
    key: 'reduceFunctionDeclaration',
    value: function reduceFunctionDeclaration(node, _ref37) {
      var name = _ref37.name,
          params = _ref37.params,
          body = _ref37.body;

      return seq(node.isAsync ? this.t('async') : empty(), this.t('function'), node.isGenerator ? seq(this.sep(Sep.BEFORE_GENERATOR_STAR), this.t('*'), this.sep(Sep.AFTER_GENERATOR_STAR)) : empty(), this.sep(Sep.BEFORE_FUNCTION_NAME(node)), node.name.name === '*default*' ? empty() : name, this.sep(Sep.BEFORE_FUNCTION_PARAMS), this.paren(params, Sep.PARAMETERS_PAREN_BEFORE, Sep.PARAMETERS_PAREN_AFTER, Sep.PARAMETERS_PAREN_EMPTY), this.sep(Sep.BEFORE_FUNCTION_DECLARATION_BODY), this.brace(body, node, Sep.FUNCTION_BRACE_INITIAL, Sep.FUNCTION_BRACE_FINAL, Sep.FUNCTION_EMPTY), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceFunctionExpression',
    value: function reduceFunctionExpression(node, _ref38) {
      var name = _ref38.name,
          params = _ref38.params,
          body = _ref38.body;

      var state = seq(node.isAsync ? this.t('async') : empty(), this.t('function'), node.isGenerator ? seq(this.sep(Sep.BEFORE_GENERATOR_STAR), this.t('*'), this.sep(Sep.AFTER_GENERATOR_STAR)) : empty(), this.sep(Sep.BEFORE_FUNCTION_NAME(node)), name ? name : empty(), this.sep(Sep.BEFORE_FUNCTION_PARAMS), this.paren(params, Sep.PARAMETERS_PAREN_BEFORE, Sep.PARAMETERS_PAREN_AFTER, Sep.PARAMETERS_PAREN_EMPTY), this.sep(Sep.BEFORE_FUNCTION_EXPRESSION_BODY), this.brace(body, node, Sep.FUNCTION_EXPRESSION_BRACE_INITIAL, Sep.FUNCTION_EXPRESSION_BRACE_FINAL, Sep.FUNCTION_EXPRESSION_EMPTY));
      state.startsWithFunctionOrClass = true;
      return state;
    }
  }, {
    key: 'reduceFormalParameters',
    value: function reduceFormalParameters(node, _ref39) {
      var items = _ref39.items,
          rest = _ref39.rest;

      return this.commaSep(items.concat(rest == null ? [] : [seq(this.t('...'), this.sep(Sep.REST), rest)]), Sep.PARAMETER_BEFORE_COMMA, Sep.PARAMETER_AFTER_COMMA);
    }
  }, {
    key: 'reduceArrowExpression',
    value: function reduceArrowExpression(node, _ref40) {
      var params = _ref40.params,
          body = _ref40.body;

      if (node.params.rest != null || node.params.items.length !== 1 || node.params.items[0].type !== 'BindingIdentifier') {
        params = this.paren(params, Sep.ARROW_PARAMETERS_PAREN_BEFORE, Sep.ARROW_PARAMETERS_PAREN_AFTER, Sep.ARROW_PARAMETERS_PAREN_EMPTY);
      }
      var containsIn = false;
      if (node.body.type === 'FunctionBody') {
        body = this.brace(body, node, Sep.ARROW_BRACE_INITIAL, Sep.ARROW_BRACE_FINAL, Sep.ARROW_BRACE_EMPTY);
      } else if (body.startsWithCurly) {
        body = this.paren(body, Sep.ARROW_BODY_PAREN_BEFORE, Sep.ARROW_BODY_PAREN_AFTER);
      } else if (body.containsIn) {
        containsIn = true;
      }
      return (0, _objectAssign2.default)(seq(node.isAsync ? seq(this.t('async'), this.sep(Sep.BEFORE_ARROW_ASYNC_PARAMS)) : empty(), params, this.sep(Sep.BEFORE_ARROW), this.t('=>'), this.sep(Sep.AFTER_ARROW), this.p(node.body, coderep.Precedence.Assignment, body)), { containsIn: containsIn });
    }
  }, {
    key: 'reduceGetter',
    value: function reduceGetter(node, _ref41) {
      var name = _ref41.name,
          body = _ref41.body;

      return seq(this.t('get'), this.sep(Sep.AFTER_GET), name, this.sep(Sep.BEFORE_GET_PARAMS), this.paren(empty(), null, null, Sep.GETTER_PARAMS), this.sep(Sep.BEFORE_GET_BODY), this.brace(body, node, Sep.GET_BRACE_INTIAL, Sep.GET_BRACE_FINAL, Sep.GET_BRACE_EMPTY));
    }
  }, {
    key: 'reduceIdentifierExpression',
    value: function reduceIdentifierExpression(node) {
      var a = this.t(node.name);
      if (node.name === 'let') {
        a.startsWithLet = true;
      }
      return a;
    }
  }, {
    key: 'reduceIfStatement',
    value: function reduceIfStatement(node, _ref42) {
      var test = _ref42.test,
          consequent = _ref42.consequent,
          alternate = _ref42.alternate;

      if (alternate && consequent.endsWithMissingElse) {
        consequent = this.brace(consequent, node, Sep.MISSING_ELSE_INTIIAL, Sep.MISSING_ELSE_FINAL, Sep.MISSING_ELSE_EMPTY);
      }
      return (0, _objectAssign2.default)(seq(this.t('if'), this.sep(Sep.AFTER_IF), this.paren(test, Sep.IF_PAREN_BEFORE, Sep.IF_PAREN_AFTER), this.sep(Sep.AFTER_IF_TEST), consequent, alternate ? seq(this.sep(Sep.BEFORE_ELSE), this.t('else'), this.sep(Sep.AFTER_ELSE), alternate) : empty(), this.sep(Sep.AFTER_STATEMENT(node))), { endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true });
    }
  }, {
    key: 'reduceImport',
    value: function reduceImport(node, _ref43) {
      var defaultBinding = _ref43.defaultBinding,
          namedImports = _ref43.namedImports;

      var bindings = [];
      if (defaultBinding != null) {
        bindings.push(defaultBinding);
      }
      if (namedImports.length > 0) {
        bindings.push(this.brace(this.commaSep(namedImports, Sep.NAMED_IMPORT_BEFORE_COMMA, Sep.NAMED_IMPORT_AFTER_COMMA), node, Sep.IMPORT_BRACE_INTIAL, Sep.IMPORT_BRACE_FINAL, Sep.IMPORT_BRACE_EMPTY));
      }
      if (bindings.length === 0) {
        return seq(this.t('import'), this.sep(Sep.BEFORE_IMPORT_MODULE), this.t((0, coderep.escapeStringLiteral)(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
      }
      return seq(this.t('import'), this.sep(Sep.BEFORE_IMPORT_BINDINGS), this.commaSep(bindings, Sep.IMPORT_BEFORE_COMMA, Sep.IMPORT_AFTER_COMMA), this.sep(Sep.AFTER_IMPORT_BINDINGS), this.t('from'), this.sep(Sep.AFTER_FROM), this.t((0, coderep.escapeStringLiteral)(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceImportNamespace',
    value: function reduceImportNamespace(node, _ref44) {
      var defaultBinding = _ref44.defaultBinding,
          namespaceBinding = _ref44.namespaceBinding;

      return seq(this.t('import'), this.sep(Sep.BEFORE_IMPORT_NAMESPACE), defaultBinding == null ? empty() : seq(defaultBinding, this.sep(Sep.IMPORT_BEFORE_COMMA), this.t(','), this.sep(Sep.IMPORT_AFTER_COMMA)), this.sep(Sep.BEFORE_IMPORT_STAR), this.t('*'), this.sep(Sep.AFTER_IMPORT_STAR), this.t('as'), this.sep(Sep.AFTER_IMPORT_AS), namespaceBinding, this.sep(Sep.AFTER_NAMESPACE_BINDING), this.t('from'), this.sep(Sep.AFTER_FROM), this.t((0, coderep.escapeStringLiteral)(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceImportSpecifier',
    value: function reduceImportSpecifier(node, _ref45) {
      var binding = _ref45.binding;

      if (node.name == null) return binding;
      return seq(this.t(node.name), this.sep(Sep.BEFORE_IMPORT_AS), this.t('as'), this.sep(Sep.AFTER_IMPORT_AS), binding);
    }
  }, {
    key: 'reduceExportAllFrom',
    value: function reduceExportAllFrom(node) {
      return seq(this.t('export'), this.sep(Sep.BEFORE_EXPORT_STAR), this.t('*'), this.sep(Sep.AFTER_EXPORT_STAR), this.t('from'), this.sep(Sep.AFTER_FROM), this.t((0, coderep.escapeStringLiteral)(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceExportFrom',
    value: function reduceExportFrom(node, _ref46) {
      var namedExports = _ref46.namedExports;

      return seq(this.t('export'), this.sep(Sep.BEFORE_EXPORT_BINDINGS), this.brace(this.commaSep(namedExports, Sep.EXPORTS_BEFORE_COMMA, Sep.EXPORTS_AFTER_COMMA), node, Sep.EXPORT_BRACE_INITIAL, Sep.EXPORT_BRACE_FINAL, Sep.EXPORT_BRACE_EMPTY), this.sep(Sep.AFTER_EXPORT_FROM_BINDINGS), this.t('from'), this.sep(Sep.AFTER_FROM), this.t((0, coderep.escapeStringLiteral)(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceExportLocals',
    value: function reduceExportLocals(node, _ref47) {
      var namedExports = _ref47.namedExports;

      return seq(this.t('export'), this.sep(Sep.BEFORE_EXPORT_BINDINGS), this.brace(this.commaSep(namedExports, Sep.EXPORTS_BEFORE_COMMA, Sep.EXPORTS_AFTER_COMMA), node, Sep.EXPORT_BRACE_INITIAL, Sep.EXPORT_BRACE_FINAL, Sep.EXPORT_BRACE_EMPTY), this.sep(Sep.AFTER_EXPORT_LOCAL_BINDINGS), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceExport',
    value: function reduceExport(node, _ref48) {
      var declaration = _ref48.declaration;

      switch (node.declaration.type) {
        case 'FunctionDeclaration':
        case 'ClassDeclaration':
          break;
        default:
          declaration = seq(declaration, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
      }
      return seq(this.t('export'), this.sep(Sep.AFTER_EXPORT), declaration);
    }
  }, {
    key: 'reduceExportDefault',
    value: function reduceExportDefault(node, _ref49) {
      var body = _ref49.body;

      body = body.startsWithFunctionOrClass ? this.paren(body, Sep.EXPORT_PAREN_BEFORE, Sep.EXPORT_PAREN_AFTER) : body;
      switch (node.body.type) {
        case 'FunctionDeclaration':
        case 'ClassDeclaration':
          return seq(this.t('export'), this.sep(Sep.EXPORT_DEFAULT), this.t('default'), this.sep(Sep.AFTER_EXPORT_DEFAULT), body);
        default:
          return seq(this.t('export'), this.sep(Sep.EXPORT_DEFAULT), this.t('default'), this.sep(Sep.AFTER_EXPORT_DEFAULT), this.p(node.body, coderep.Precedence.Assignment, body), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
      }
    }
  }, {
    key: 'reduceExportFromSpecifier',
    value: function reduceExportFromSpecifier(node) {
      if (node.exportedName == null) return this.t(node.name);
      return seq(this.t(node.name), this.sep(Sep.BEFORE_EXPORT_AS), this.t('as'), this.sep(Sep.AFTER_EXPORT_AS), this.t(node.exportedName));
    }
  }, {
    key: 'reduceExportLocalSpecifier',
    value: function reduceExportLocalSpecifier(node, _ref50) {
      var name = _ref50.name;

      if (node.exportedName == null) return name;
      return seq(name, this.sep(Sep.BEFORE_EXPORT_AS), this.t('as'), this.sep(Sep.AFTER_EXPORT_AS), this.t(node.exportedName));
    }
  }, {
    key: 'reduceLabeledStatement',
    value: function reduceLabeledStatement(node, _ref51) {
      var body = _ref51.body;

      return (0, _objectAssign2.default)(seq(this.t(node.label), this.sep(Sep.BEFORE_LABEL_COLON), this.t(':'), this.sep(Sep.AFTER_LABEL_COLON), body), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: 'reduceLiteralBooleanExpression',
    value: function reduceLiteralBooleanExpression(node) {
      return this.t(node.value.toString());
    }
  }, {
    key: 'reduceLiteralNullExpression',
    value: function reduceLiteralNullExpression() /* node */{
      return this.t('null');
    }
  }, {
    key: 'reduceLiteralInfinityExpression',
    value: function reduceLiteralInfinityExpression() /* node */{
      return this.t('2e308');
    }
  }, {
    key: 'reduceLiteralNumericExpression',
    value: function reduceLiteralNumericExpression(node) {
      return new coderep.NumberCodeRep(node.value);
    }
  }, {
    key: 'reduceLiteralRegExpExpression',
    value: function reduceLiteralRegExpExpression(node) {
      return this.t('/' + node.pattern + '/' + (node.global ? 'g' : '') + (node.ignoreCase ? 'i' : '') + (node.multiLine ? 'm' : '') + (node.dotAll ? 's' : '') + (node.unicode ? 'u' : '') + (node.sticky ? 'y' : ''), true);
    }
  }, {
    key: 'reduceLiteralStringExpression',
    value: function reduceLiteralStringExpression(node) {
      return this.t((0, coderep.escapeStringLiteral)(node.value));
    }
  }, {
    key: 'reduceMethod',
    value: function reduceMethod(node, _ref52) {
      var name = _ref52.name,
          params = _ref52.params,
          body = _ref52.body;

      return seq(node.isAsync ? seq(this.t('async'), this.sep(Sep.AFTER_METHOD_ASYNC)) : empty(), node.isGenerator ? seq(this.t('*'), this.sep(Sep.AFTER_METHOD_GENERATOR_STAR)) : empty(), name, this.sep(Sep.AFTER_METHOD_NAME), this.paren(params, Sep.PARAMETERS_PAREN_BEFORE, Sep.PARAMETERS_PAREN_AFTER, Sep.PARAMETERS_PAREN_EMPTY), this.sep(Sep.BEFORE_METHOD_BODY), this.brace(body, node, Sep.METHOD_BRACE_INTIAL, Sep.METHOD_BRACE_FINAL, Sep.METHOD_BRACE_EMPTY));
    }
  }, {
    key: 'reduceModule',
    value: function reduceModule(node, _ref53) {
      var directives = _ref53.directives,
          items = _ref53.items;

      if (items.length) {
        items[0] = this.parenToAvoidBeingDirective(node.items[0], items[0]);
      }
      return seq.apply(undefined, _toConsumableArray(directives).concat([directives.length ? this.sep(Sep.AFTER_MODULE_DIRECTIVES) : empty()], _toConsumableArray(items)));
    }
  }, {
    key: 'reduceNewExpression',
    value: function reduceNewExpression(node, _ref54) {
      var _this7 = this;

      var callee = _ref54.callee,
          args = _ref54.arguments;

      var parenthizedArgs = args.map(function (a, i) {
        return _this7.p(node.arguments[i], coderep.Precedence.Assignment, a);
      });
      var calleeRep = (0, coderep.getPrecedence)(node.callee) === coderep.Precedence.Call ? this.paren(callee, Sep.NEW_CALLEE_PAREN_BEFORE, Sep.NEW_CALLEE_PAREN_AFTER) : this.p(node.callee, (0, coderep.getPrecedence)(node), callee);
      return seq(this.t('new'), this.sep(Sep.AFTER_NEW), calleeRep, args.length === 0 ? this.sep(Sep.EMPTY_NEW_CALL) : seq(this.sep(Sep.BEFORE_NEW_ARGS), this.paren(this.commaSep(parenthizedArgs, Sep.ARGS_BEFORE_COMMA, Sep.ARGS_AFTER_COMMA), Sep.NEW_PAREN_BEFORE, Sep.NEW_PAREN_AFTER, Sep.NEW_PAREN_EMPTY)));
    }
  }, {
    key: 'reduceNewTargetExpression',
    value: function reduceNewTargetExpression() {
      return seq(this.t('new'), this.sep(Sep.NEW_TARGET_BEFORE_DOT), this.t('.'), this.sep(Sep.NEW_TARGET_AFTER_DOT), this.t('target'));
    }
  }, {
    key: 'reduceObjectExpression',
    value: function reduceObjectExpression(node, _ref55) {
      var properties = _ref55.properties;

      var state = this.brace(this.commaSep(properties, Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA), node, Sep.OBJECT_BRACE_INITIAL, Sep.OBJECT_BRACE_FINAL, Sep.OBJECT_EMPTY);
      state.startsWithCurly = true;
      return state;
    }
  }, {
    key: 'reduceUpdateExpression',
    value: function reduceUpdateExpression(node, _ref56) {
      var operand = _ref56.operand;

      if (node.isPrefix) {
        return this.reduceUnaryExpression.apply(this, arguments);
      }
      return (0, _objectAssign2.default)(seq(this.p(node.operand, coderep.Precedence.New, operand), this.sep(Sep.BEFORE_POSTFIX(node.operator)), this.t(node.operator)), {
        startsWithCurly: operand.startsWithCurly,
        startsWithLetSquareBracket: operand.startsWithLetSquareBracket,
        startsWithFunctionOrClass: operand.startsWithFunctionOrClass
      });
    }
  }, {
    key: 'reduceUnaryExpression',
    value: function reduceUnaryExpression(node, _ref57) {
      var operand = _ref57.operand;

      return seq(this.t(node.operator), this.sep(Sep.UNARY(node.operator)), this.p(node.operand, (0, coderep.getPrecedence)(node), operand));
    }
  }, {
    key: 'reduceReturnStatement',
    value: function reduceReturnStatement(node, _ref58) {
      var expression = _ref58.expression;

      return seq(this.t('return'), expression ? seq(this.sep(Sep.RETURN), expression) : empty(), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceScript',
    value: function reduceScript(node, _ref59) {
      var directives = _ref59.directives,
          statements = _ref59.statements;

      if (statements.length) {
        statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
      }
      return seq.apply(undefined, _toConsumableArray(directives).concat([directives.length ? this.sep(Sep.AFTER_SCRIPT_DIRECTIVES) : empty()], _toConsumableArray(statements)));
    }
  }, {
    key: 'reduceSetter',
    value: function reduceSetter(node, _ref60) {
      var name = _ref60.name,
          param = _ref60.param,
          body = _ref60.body;

      return seq(this.t('set'), this.sep(Sep.AFTER_SET), name, this.sep(Sep.BEFORE_SET_PARAMS), this.paren(param, Sep.SETTER_PARAM_BEFORE, Sep.SETTER_PARAM_AFTER), this.sep(Sep.BEFORE_SET_BODY), this.brace(body, node, Sep.SET_BRACE_INTIIAL, Sep.SET_BRACE_FINAL, Sep.SET_BRACE_EMPTY));
    }
  }, {
    key: 'reduceShorthandProperty',
    value: function reduceShorthandProperty(node, _ref61) {
      var name = _ref61.name;

      return name;
    }
  }, {
    key: 'reduceStaticMemberAssignmentTarget',
    value: function reduceStaticMemberAssignmentTarget(node, _ref62) {
      var object = _ref62.object;

      var state = seq(this.p(node.object, (0, coderep.getPrecedence)(node), object), this.sep(Sep.BEFORE_STATIC_MEMBER_ASSIGNMENT_TARGET_DOT), this.t('.'), this.sep(Sep.AFTER_STATIC_MEMBER_ASSIGNMENT_TARGET_DOT), this.t(node.property));
      state.startsWithLet = object.startsWithLet;
      state.startsWithCurly = object.startsWithCurly;
      state.startsWithLetSquareBracket = object.startsWithLetSquareBracket;
      state.startsWithFunctionOrClass = object.startsWithFunctionOrClass;
      return state;
    }
  }, {
    key: 'reduceStaticMemberExpression',
    value: function reduceStaticMemberExpression(node, _ref63) {
      var object = _ref63.object;

      var state = seq(this.p(node.object, (0, coderep.getPrecedence)(node), object), this.sep(Sep.BEFORE_STATIC_MEMBER_DOT), this.t('.'), this.sep(Sep.AFTER_STATIC_MEMBER_DOT), this.t(node.property));
      state.startsWithLet = object.startsWithLet;
      state.startsWithCurly = object.startsWithCurly;
      state.startsWithLetSquareBracket = object.startsWithLetSquareBracket;
      state.startsWithFunctionOrClass = object.startsWithFunctionOrClass;
      return state;
    }
  }, {
    key: 'reduceStaticPropertyName',
    value: function reduceStaticPropertyName(node) {
      if (utils.keyword.isIdentifierNameES6(node.value)) {
        return this.t(node.value);
      }
      var n = parseFloat(node.value);
      if (n >= 0 && n.toString() === node.value) {
        return new coderep.NumberCodeRep(n);
      }
      return this.t((0, coderep.escapeStringLiteral)(node.value));
    }
  }, {
    key: 'reduceSuper',
    value: function reduceSuper() {
      return this.t('super');
    }
  }, {
    key: 'reduceSwitchCase',
    value: function reduceSwitchCase(node, _ref64) {
      var test = _ref64.test,
          consequent = _ref64.consequent;

      return seq(this.t('case'), this.sep(Sep.BEFORE_CASE_TEST), test, this.sep(Sep.AFTER_CASE_TEST), this.t(':'), this.sep(Sep.BEFORE_CASE_BODY), seq.apply(undefined, _toConsumableArray(consequent)), this.sep(Sep.AFTER_CASE_BODY));
    }
  }, {
    key: 'reduceSwitchDefault',
    value: function reduceSwitchDefault(node, _ref65) {
      var consequent = _ref65.consequent;

      return seq(this.t('default'), this.sep(Sep.DEFAULT), this.t(':'), this.sep(Sep.BEFORE_CASE_BODY), seq.apply(undefined, _toConsumableArray(consequent)), this.sep(Sep.AFTER_DEFAULT_BODY));
    }
  }, {
    key: 'reduceSwitchStatement',
    value: function reduceSwitchStatement(node, _ref66) {
      var discriminant = _ref66.discriminant,
          cases = _ref66.cases;

      return seq(this.t('switch'), this.sep(Sep.BEFORE_SWITCH_DISCRIM), this.paren(discriminant, Sep.SWITCH_DISCRIM_PAREN_BEFORE, Sep.SWITCH_DISCRIM_PAREN_AFTER), this.sep(Sep.BEFORE_SWITCH_BODY), this.brace(seq.apply(undefined, _toConsumableArray(cases)), node, Sep.SWITCH_BRACE_INTIAL, Sep.SWITCH_BRACE_FINAL, Sep.SWITCH_BRACE_EMPTY), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceSwitchStatementWithDefault',
    value: function reduceSwitchStatementWithDefault(node, _ref67) {
      var discriminant = _ref67.discriminant,
          preDefaultCases = _ref67.preDefaultCases,
          defaultCase = _ref67.defaultCase,
          postDefaultCases = _ref67.postDefaultCases;

      return seq(this.t('switch'), this.sep(Sep.BEFORE_SWITCH_DISCRIM), this.paren(discriminant, Sep.SWITCH_DISCRIM_PAREN_BEFORE, Sep.SWITCH_DISCRIM_PAREN_AFTER), this.sep(Sep.BEFORE_SWITCH_BODY), this.brace(seq.apply(undefined, _toConsumableArray(preDefaultCases).concat([defaultCase], _toConsumableArray(postDefaultCases))), node, Sep.SWITCH_BRACE_INTIAL, Sep.SWITCH_BRACE_FINAL, Sep.SWITCH_BRACE_EMPTY), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceTemplateExpression',
    value: function reduceTemplateExpression(node, _ref68) {
      var tag = _ref68.tag,
          elements = _ref68.elements;

      var state = node.tag == null ? empty() : seq(this.p(node.tag, (0, coderep.getPrecedence)(node), tag), this.sep(Sep.TEMPLATE_TAG));
      state = seq(state, this.t('`'));
      for (var _i = 0, l = node.elements.length; _i < l; ++_i) {
        if (node.elements[_i].type === 'TemplateElement') {
          var d = '';
          if (_i > 0) d += '}';
          d += node.elements[_i].rawValue;
          if (_i < l - 1) d += '${';
          state = seq(state, this.t(d));
        } else {
          state = seq(state, this.sep(Sep.BEFORE_TEMPLATE_EXPRESSION), elements[_i], this.sep(Sep.AFTER_TEMPLATE_EXPRESSION));
        }
      }
      state = seq(state, this.t('`'));
      if (node.tag != null) {
        state.startsWithCurly = tag.startsWithCurly;
        state.startsWithLet = tag.startsWithLet;
        state.startsWithLetSquareBracket = tag.startsWithLetSquareBracket;
        state.startsWithFunctionOrClass = tag.startsWithFunctionOrClass;
      }
      return state;
    }
  }, {
    key: 'reduceTemplateElement',
    value: function reduceTemplateElement(node) {
      return this.t(node.rawValue);
    }
  }, {
    key: 'reduceThisExpression',
    value: function reduceThisExpression() /* node */{
      return this.t('this');
    }
  }, {
    key: 'reduceThrowStatement',
    value: function reduceThrowStatement(node, _ref69) {
      var expression = _ref69.expression;

      return seq(this.t('throw'), this.sep(Sep.THROW), expression, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceTryCatchStatement',
    value: function reduceTryCatchStatement(node, _ref70) {
      var body = _ref70.body,
          catchClause = _ref70.catchClause;

      return seq(this.t('try'), this.sep(Sep.AFTER_TRY), body, this.sep(Sep.BEFORE_CATCH), catchClause, this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceTryFinallyStatement',
    value: function reduceTryFinallyStatement(node, _ref71) {
      var body = _ref71.body,
          catchClause = _ref71.catchClause,
          finalizer = _ref71.finalizer;

      return seq(this.t('try'), this.sep(Sep.AFTER_TRY), body, catchClause ? seq(this.sep(Sep.BEFORE_CATCH), catchClause) : empty(), this.sep(Sep.BEFORE_FINALLY), this.t('finally'), this.sep(Sep.AFTER_FINALLY), finalizer, this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceYieldExpression',
    value: function reduceYieldExpression(node, _ref72) {
      var expression = _ref72.expression;

      if (node.expression == null) return this.t('yield');
      return (0, _objectAssign2.default)(seq(this.t('yield'), this.sep(Sep.YIELD), this.p(node.expression, (0, coderep.getPrecedence)(node), expression)), { containsIn: expression.containsIn });
    }
  }, {
    key: 'reduceYieldGeneratorExpression',
    value: function reduceYieldGeneratorExpression(node, _ref73) {
      var expression = _ref73.expression;

      return (0, _objectAssign2.default)(seq(this.t('yield'), this.sep(Sep.BEFORE_YIELD_STAR), this.t('*'), this.sep(Sep.AFTER_YIELD_STAR), this.p(node.expression, (0, coderep.getPrecedence)(node), expression)), { containsIn: expression.containsIn });
    }
  }, {
    key: 'reduceDirective',
    value: function reduceDirective(node) {
      var delim = node.rawValue.match(/(^|[^\\])(\\\\)*"/) ? '\'' : '"';
      return seq(this.t(delim + node.rawValue + delim), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceVariableDeclaration',
    value: function reduceVariableDeclaration(node, _ref74) {
      var declarators = _ref74.declarators;

      return seq(this.t(node.kind), this.sep(Sep.VARIABLE_DECLARATION), this.commaSep(declarators, Sep.DECLARATORS_BEFORE_COMMA, Sep.DECLARATORS_AFTER_COMMA));
    }
  }, {
    key: 'reduceVariableDeclarationStatement',
    value: function reduceVariableDeclarationStatement(node, _ref75) {
      var declaration = _ref75.declaration;

      return seq(declaration, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceVariableDeclarator',
    value: function reduceVariableDeclarator(node, _ref76) {
      var binding = _ref76.binding,
          init = _ref76.init;

      var containsIn = init && init.containsIn && !init.containsGroup;
      if (init) {
        if (init.containsGroup) {
          init = this.paren(init, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
        } else {
          init = markContainsIn(init);
        }
      }
      return (0, _objectAssign2.default)(init == null ? binding : seq(binding, this.sep(Sep.BEFORE_INIT_EQUALS), this.t('='), this.sep(Sep.AFTER_INIT_EQUALS), init), { containsIn: containsIn });
    }
  }, {
    key: 'reduceWhileStatement',
    value: function reduceWhileStatement(node, _ref77) {
      var test = _ref77.test,
          body = _ref77.body;

      return (0, _objectAssign2.default)(seq(this.t('while'), this.sep(Sep.AFTER_WHILE), this.paren(test, Sep.WHILE_TEST_PAREN_BEFORE, Sep.WHILE_TEST_PAREN_AFTER), this.sep(Sep.BEFORE_WHILE_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: 'reduceWithStatement',
    value: function reduceWithStatement(node, _ref78) {
      var object = _ref78.object,
          body = _ref78.body;

      return (0, _objectAssign2.default)(seq(this.t('with'), this.sep(Sep.AFTER_WITH), this.paren(object, Sep.WITH_PAREN_BEFORE, Sep.WITH_PAREN_AFTER), this.sep(Sep.BEFORE_WITH_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }]);

  return ExtensibleCodeGen;
}();

function withoutTrailingLinebreak(state) {
  if (state && state instanceof coderep.Seq) {
    var lastChild = state.children[state.children.length - 1];
    /* istanbul ignore next */
    while (lastChild instanceof coderep.Empty) {
      state.children.pop();
      lastChild = state.children[state.children.length - 1];
    }
    /* istanbul ignore else */
    if (lastChild instanceof coderep.Seq) {
      withoutTrailingLinebreak(lastChild);
    } else if (lastChild instanceof Linebreak) {
      state.children.pop();
    }
  }
  return state;
}

function indent(rep, includingFinal) {
  var finalLinebreak = void 0;
  function indentNode(node) {
    if (node instanceof Linebreak) {
      finalLinebreak = node;
      ++node.indentation;
    }
  }
  rep.forEach(indentNode);
  if (!includingFinal) {
    --finalLinebreak.indentation;
  }
  return rep;
}

var FormattedCodeGen = exports.FormattedCodeGen = function (_ExtensibleCodeGen) {
  _inherits(FormattedCodeGen, _ExtensibleCodeGen);

  function FormattedCodeGen() {
    _classCallCheck(this, FormattedCodeGen);

    return _possibleConstructorReturn(this, (FormattedCodeGen.__proto__ || Object.getPrototypeOf(FormattedCodeGen)).apply(this, arguments));
  }

  _createClass(FormattedCodeGen, [{
    key: 'parenToAvoidBeingDirective',
    value: function parenToAvoidBeingDirective(element, original) {
      if (element && element.type === 'ExpressionStatement' && element.expression.type === 'LiteralStringExpression') {
        return seq(this.paren(original.children[0], Sep.PAREN_AVOIDING_DIRECTIVE_BEFORE, Sep.PAREN_AVOIDING_DIRECTIVE_AFTER), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(element)));
      }
      return original;
    }
  }, {
    key: 'brace',
    value: function brace(rep, node) {
      if (isEmpty(rep)) {
        return this.t('{}');
      }

      switch (node.type) {
        case 'ObjectAssignmentTarget':
        case 'ObjectBinding':
        case 'Import':
        case 'ExportFrom':
        case 'ExportLocals':
        case 'ObjectExpression':
          return new coderep.Brace(rep);
      }

      rep = seq(new Linebreak(), rep);
      indent(rep, false);
      return new coderep.Brace(rep);
    }
  }, {
    key: 'reduceDoWhileStatement',
    value: function reduceDoWhileStatement(node, _ref79) {
      var body = _ref79.body,
          test = _ref79.test;

      return seq(this.t('do'), this.sep(Sep.AFTER_DO), withoutTrailingLinebreak(body), this.sep(Sep.BEFORE_DOWHILE_WHILE), this.t('while'), this.sep(Sep.AFTER_DOWHILE_WHILE), this.paren(test, Sep.DO_WHILE_TEST_PAREN_BEFORE, Sep.DO_WHILE_TEST_PAREN_AFTER), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }, {
    key: 'reduceIfStatement',
    value: function reduceIfStatement(node, _ref80) {
      var test = _ref80.test,
          consequent = _ref80.consequent,
          alternate = _ref80.alternate;

      if (alternate && consequent.endsWithMissingElse) {
        consequent = this.brace(consequent, node);
      }
      return (0, _objectAssign2.default)(seq(this.t('if'), this.sep(Sep.AFTER_IF), this.paren(test, Sep.IF_PAREN_BEFORE, Sep.IF_PAREN_AFTER), this.sep(Sep.AFTER_IF_TEST), withoutTrailingLinebreak(consequent), alternate ? seq(this.sep(Sep.BEFORE_ELSE), this.t('else'), this.sep(Sep.AFTER_ELSE), withoutTrailingLinebreak(alternate)) : empty(), this.sep(Sep.AFTER_STATEMENT(node))), { endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true });
    }
  }, {
    key: 'reduceSwitchCase',
    value: function reduceSwitchCase(node, _ref81) {
      var test = _ref81.test,
          consequent = _ref81.consequent;

      consequent = indent(withoutTrailingLinebreak(seq.apply(undefined, [this.sep(Sep.BEFORE_CASE_BODY)].concat(_toConsumableArray(consequent)))), true);
      return seq(this.t('case'), this.sep(Sep.BEFORE_CASE_TEST), test, this.sep(Sep.AFTER_CASE_TEST), this.t(':'), consequent, this.sep(Sep.AFTER_CASE_BODY));
    }
  }, {
    key: 'reduceSwitchDefault',
    value: function reduceSwitchDefault(node, _ref82) {
      var consequent = _ref82.consequent;

      consequent = indent(withoutTrailingLinebreak(seq.apply(undefined, [this.sep(Sep.BEFORE_CASE_BODY)].concat(_toConsumableArray(consequent)))), true);
      return seq(this.t('default'), this.sep(Sep.DEFAULT), this.t(':'), consequent, this.sep(Sep.AFTER_DEFAULT_BODY));
    }
  }, {
    key: 'sep',
    value: function sep(separator) {
      switch (separator.type) {
        case 'AWAIT':
        case 'AFTER_FORAWAIT_AWAIT':
        case 'ARRAY_AFTER_COMMA':
        case 'OBJECT_AFTER_COMMA':
        case 'ARGS_AFTER_COMMA':
        case 'PARAMETER_AFTER_COMMA':
        case 'DECLARATORS_AFTER_COMMA':
        case 'NAMED_IMPORT_AFTER_COMMA':
        case 'IMPORT_AFTER_COMMA':
        case 'BEFORE_DEFAULT_EQUALS':
        case 'AFTER_DEFAULT_EQUALS':
        case 'AFTER_PROP':
        case 'BEFORE_JUMP_LABEL':
        case 'BEFORE_CATCH_BINDING':
        case 'AFTER_CATCH_BINDING':
        case 'BEFORE_CLASS_NAME':
        case 'BEFORE_EXTENDS':
        case 'AFTER_EXTENDS':
        case 'BEFORE_CLASS_DECLARATION_ELEMENTS':
        case 'BEFORE_CLASS_EXPRESSION_ELEMENTS':
        case 'AFTER_STATIC':
        case 'BEFORE_TERNARY_QUESTION':
        case 'AFTER_TERNARY_QUESTION':
        case 'BEFORE_TERNARY_COLON':
        case 'AFTER_TERNARY_COLON':
        case 'AFTER_DO':
        case 'BEFORE_DOWHILE_WHILE':
        case 'AFTER_DOWHILE_WHILE':
        case 'AFTER_FORIN_FOR':
        case 'BEFORE_FORIN_IN':
        case 'BEFORE_FORIN_BODY':
        case 'BEFORE_FOROF_OF':
        case 'AFTER_FOROF_FOR':
        case 'BEFORE_FOROF_BODY':
        case 'AFTER_FOR_FOR':
        case 'BEFORE_FOR_TEST':
        case 'BEFORE_FOR_UPDATE':
        case 'BEFORE_FOR_BODY':
        case 'BEFORE_FUNCTION_DECLARATION_BODY':
        case 'BEFORE_FUNCTION_EXPRESSION_BODY':
        case 'BEFORE_ARROW':
        case 'AFTER_ARROW':
        case 'BEFORE_ARROW_ASYNC_PARAMS':
        case 'AFTER_GET':
        case 'BEFORE_GET_BODY':
        case 'AFTER_IF':
        case 'AFTER_IF_TEST':
        case 'BEFORE_ELSE':
        case 'AFTER_ELSE':
        case 'BEFORE_IMPORT_BINDINGS':
        case 'BEFORE_IMPORT_MODULE':
        case 'AFTER_IMPORT_BINDINGS':
        case 'AFTER_FROM':
        case 'BEFORE_IMPORT_NAMESPACE':
        case 'BEFORE_IMPORT_STAR':
        case 'AFTER_IMPORT_STAR':
        case 'AFTER_NAMESPACE_BINDING':
        case 'BEFORE_IMPORT_AS':
        case 'AFTER_IMPORT_AS':
        case 'EXPORTS_AFTER_COMMA':
        case 'BEFORE_EXPORT_STAR':
        case 'AFTER_EXPORT_STAR':
        case 'BEFORE_EXPORT_BINDINGS':
        case 'AFTER_EXPORT_FROM_BINDINGS':
        case 'AFTER_EXPORT':
        case 'AFTER_EXPORT_DEFAULT':
        case 'BEFORE_EXPORT_AS':
        case 'AFTER_EXPORT_AS':
        case 'AFTER_LABEL_COLON':
        case 'AFTER_METHOD_ASYNC':
        case 'BEFORE_METHOD_BODY':
        case 'AFTER_NEW':
        case 'RETURN':
        case 'AFTER_SET':
        case 'BEFORE_SET_BODY':
        case 'BEFORE_SET_PARAMS':
        case 'BEFORE_CASE_TEST':
        case 'BEFORE_SWITCH_DISCRIM':
        case 'BEFORE_SWITCH_BODY':
        case 'THROW':
        case 'AFTER_TRY':
        case 'BEFORE_CATCH':
        case 'BEFORE_FINALLY':
        case 'AFTER_FINALLY':
        case 'VARIABLE_DECLARATION':
        case 'YIELD':
        case 'AFTER_YIELD_STAR':
        case 'BEFORE_INIT_EQUALS':
        case 'AFTER_INIT_EQUALS':
        case 'AFTER_WHILE':
        case 'BEFORE_WHILE_BODY':
        case 'AFTER_WITH':
        case 'BEFORE_WITH_BODY':
        case 'BEFORE_FUNCTION_NAME':
        case 'AFTER_BINOP':
        case 'BEFORE_ASSIGN_OP':
        case 'AFTER_ASSIGN_OP':
          return this.t(' ');
        case 'AFTER_STATEMENT':
          switch (separator.node.type) {
            case 'ForInStatement':
            case 'ForOfStatement':
            case 'ForStatement':
            case 'WhileStatement':
            case 'WithStatement':
              return empty(); // because those already end with an AFTER_STATEMENT
            default:
              return new Linebreak();
          }
        case 'AFTER_CLASS_ELEMENT':
        case 'BEFORE_CASE_BODY':
        case 'AFTER_CASE_BODY':
        case 'AFTER_DEFAULT_BODY':
          return new Linebreak();
        case 'BEFORE_BINOP':
          return separator.op === ',' ? empty() : this.t(' ');
        case 'UNARY':
          return separator.op === 'delete' || separator.op === 'void' || separator.op === 'typeof' ? this.t(' ') : empty();
        default:
          return empty();
      }
    }
  }]);

  return FormattedCodeGen;
}(ExtensibleCodeGen);
});

var director_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reduce = reduce;
// Generated by generate-director.js
/**
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

var director = {
  ArrayAssignmentTarget: function ArrayAssignmentTarget(reducer, node) {
    var _this = this;

    return reducer.reduceArrayAssignmentTarget(node, { elements: node.elements.map(function (v) {
        return v && _this[v.type](reducer, v);
      }), rest: node.rest && this[node.rest.type](reducer, node.rest) });
  },
  ArrayBinding: function ArrayBinding(reducer, node) {
    var _this2 = this;

    return reducer.reduceArrayBinding(node, { elements: node.elements.map(function (v) {
        return v && _this2[v.type](reducer, v);
      }), rest: node.rest && this[node.rest.type](reducer, node.rest) });
  },
  ArrayExpression: function ArrayExpression(reducer, node) {
    var _this3 = this;

    return reducer.reduceArrayExpression(node, { elements: node.elements.map(function (v) {
        return v && _this3[v.type](reducer, v);
      }) });
  },
  ArrowExpression: function ArrowExpression(reducer, node) {
    return reducer.reduceArrowExpression(node, { params: this.FormalParameters(reducer, node.params), body: this[node.body.type](reducer, node.body) });
  },
  AssignmentExpression: function AssignmentExpression(reducer, node) {
    return reducer.reduceAssignmentExpression(node, { binding: this[node.binding.type](reducer, node.binding), expression: this[node.expression.type](reducer, node.expression) });
  },
  AssignmentTargetIdentifier: function AssignmentTargetIdentifier(reducer, node) {
    return reducer.reduceAssignmentTargetIdentifier(node);
  },
  AssignmentTargetPropertyIdentifier: function AssignmentTargetPropertyIdentifier(reducer, node) {
    return reducer.reduceAssignmentTargetPropertyIdentifier(node, { binding: this.AssignmentTargetIdentifier(reducer, node.binding), init: node.init && this[node.init.type](reducer, node.init) });
  },
  AssignmentTargetPropertyProperty: function AssignmentTargetPropertyProperty(reducer, node) {
    return reducer.reduceAssignmentTargetPropertyProperty(node, { name: this[node.name.type](reducer, node.name), binding: this[node.binding.type](reducer, node.binding) });
  },
  AssignmentTargetWithDefault: function AssignmentTargetWithDefault(reducer, node) {
    return reducer.reduceAssignmentTargetWithDefault(node, { binding: this[node.binding.type](reducer, node.binding), init: this[node.init.type](reducer, node.init) });
  },
  AwaitExpression: function AwaitExpression(reducer, node) {
    return reducer.reduceAwaitExpression(node, { expression: this[node.expression.type](reducer, node.expression) });
  },
  BinaryExpression: function BinaryExpression(reducer, node) {
    return reducer.reduceBinaryExpression(node, { left: this[node.left.type](reducer, node.left), right: this[node.right.type](reducer, node.right) });
  },
  BindingIdentifier: function BindingIdentifier(reducer, node) {
    return reducer.reduceBindingIdentifier(node);
  },
  BindingPropertyIdentifier: function BindingPropertyIdentifier(reducer, node) {
    return reducer.reduceBindingPropertyIdentifier(node, { binding: this.BindingIdentifier(reducer, node.binding), init: node.init && this[node.init.type](reducer, node.init) });
  },
  BindingPropertyProperty: function BindingPropertyProperty(reducer, node) {
    return reducer.reduceBindingPropertyProperty(node, { name: this[node.name.type](reducer, node.name), binding: this[node.binding.type](reducer, node.binding) });
  },
  BindingWithDefault: function BindingWithDefault(reducer, node) {
    return reducer.reduceBindingWithDefault(node, { binding: this[node.binding.type](reducer, node.binding), init: this[node.init.type](reducer, node.init) });
  },
  Block: function Block(reducer, node) {
    var _this4 = this;

    return reducer.reduceBlock(node, { statements: node.statements.map(function (v) {
        return _this4[v.type](reducer, v);
      }) });
  },
  BlockStatement: function BlockStatement(reducer, node) {
    return reducer.reduceBlockStatement(node, { block: this.Block(reducer, node.block) });
  },
  BreakStatement: function BreakStatement(reducer, node) {
    return reducer.reduceBreakStatement(node);
  },
  CallExpression: function CallExpression(reducer, node) {
    var _this5 = this;

    return reducer.reduceCallExpression(node, { callee: this[node.callee.type](reducer, node.callee), arguments: node.arguments.map(function (v) {
        return _this5[v.type](reducer, v);
      }) });
  },
  CatchClause: function CatchClause(reducer, node) {
    return reducer.reduceCatchClause(node, { binding: this[node.binding.type](reducer, node.binding), body: this.Block(reducer, node.body) });
  },
  ClassDeclaration: function ClassDeclaration(reducer, node) {
    var _this6 = this;

    return reducer.reduceClassDeclaration(node, { name: this.BindingIdentifier(reducer, node.name), super: node.super && this[node.super.type](reducer, node.super), elements: node.elements.map(function (v) {
        return _this6.ClassElement(reducer, v);
      }) });
  },
  ClassElement: function ClassElement(reducer, node) {
    return reducer.reduceClassElement(node, { method: this[node.method.type](reducer, node.method) });
  },
  ClassExpression: function ClassExpression(reducer, node) {
    var _this7 = this;

    return reducer.reduceClassExpression(node, { name: node.name && this.BindingIdentifier(reducer, node.name), super: node.super && this[node.super.type](reducer, node.super), elements: node.elements.map(function (v) {
        return _this7.ClassElement(reducer, v);
      }) });
  },
  CompoundAssignmentExpression: function CompoundAssignmentExpression(reducer, node) {
    return reducer.reduceCompoundAssignmentExpression(node, { binding: this[node.binding.type](reducer, node.binding), expression: this[node.expression.type](reducer, node.expression) });
  },
  ComputedMemberAssignmentTarget: function ComputedMemberAssignmentTarget(reducer, node) {
    return reducer.reduceComputedMemberAssignmentTarget(node, { object: this[node.object.type](reducer, node.object), expression: this[node.expression.type](reducer, node.expression) });
  },
  ComputedMemberExpression: function ComputedMemberExpression(reducer, node) {
    return reducer.reduceComputedMemberExpression(node, { object: this[node.object.type](reducer, node.object), expression: this[node.expression.type](reducer, node.expression) });
  },
  ComputedPropertyName: function ComputedPropertyName(reducer, node) {
    return reducer.reduceComputedPropertyName(node, { expression: this[node.expression.type](reducer, node.expression) });
  },
  ConditionalExpression: function ConditionalExpression(reducer, node) {
    return reducer.reduceConditionalExpression(node, { test: this[node.test.type](reducer, node.test), consequent: this[node.consequent.type](reducer, node.consequent), alternate: this[node.alternate.type](reducer, node.alternate) });
  },
  ContinueStatement: function ContinueStatement(reducer, node) {
    return reducer.reduceContinueStatement(node);
  },
  DataProperty: function DataProperty(reducer, node) {
    return reducer.reduceDataProperty(node, { name: this[node.name.type](reducer, node.name), expression: this[node.expression.type](reducer, node.expression) });
  },
  DebuggerStatement: function DebuggerStatement(reducer, node) {
    return reducer.reduceDebuggerStatement(node);
  },
  Directive: function Directive(reducer, node) {
    return reducer.reduceDirective(node);
  },
  DoWhileStatement: function DoWhileStatement(reducer, node) {
    return reducer.reduceDoWhileStatement(node, { body: this[node.body.type](reducer, node.body), test: this[node.test.type](reducer, node.test) });
  },
  EmptyStatement: function EmptyStatement(reducer, node) {
    return reducer.reduceEmptyStatement(node);
  },
  Export: function Export(reducer, node) {
    return reducer.reduceExport(node, { declaration: this[node.declaration.type](reducer, node.declaration) });
  },
  ExportAllFrom: function ExportAllFrom(reducer, node) {
    return reducer.reduceExportAllFrom(node);
  },
  ExportDefault: function ExportDefault(reducer, node) {
    return reducer.reduceExportDefault(node, { body: this[node.body.type](reducer, node.body) });
  },
  ExportFrom: function ExportFrom(reducer, node) {
    var _this8 = this;

    return reducer.reduceExportFrom(node, { namedExports: node.namedExports.map(function (v) {
        return _this8.ExportFromSpecifier(reducer, v);
      }) });
  },
  ExportFromSpecifier: function ExportFromSpecifier(reducer, node) {
    return reducer.reduceExportFromSpecifier(node);
  },
  ExportLocalSpecifier: function ExportLocalSpecifier(reducer, node) {
    return reducer.reduceExportLocalSpecifier(node, { name: this.IdentifierExpression(reducer, node.name) });
  },
  ExportLocals: function ExportLocals(reducer, node) {
    var _this9 = this;

    return reducer.reduceExportLocals(node, { namedExports: node.namedExports.map(function (v) {
        return _this9.ExportLocalSpecifier(reducer, v);
      }) });
  },
  ExpressionStatement: function ExpressionStatement(reducer, node) {
    return reducer.reduceExpressionStatement(node, { expression: this[node.expression.type](reducer, node.expression) });
  },
  ForAwaitStatement: function ForAwaitStatement(reducer, node) {
    return reducer.reduceForAwaitStatement(node, { left: this[node.left.type](reducer, node.left), right: this[node.right.type](reducer, node.right), body: this[node.body.type](reducer, node.body) });
  },
  ForInStatement: function ForInStatement(reducer, node) {
    return reducer.reduceForInStatement(node, { left: this[node.left.type](reducer, node.left), right: this[node.right.type](reducer, node.right), body: this[node.body.type](reducer, node.body) });
  },
  ForOfStatement: function ForOfStatement(reducer, node) {
    return reducer.reduceForOfStatement(node, { left: this[node.left.type](reducer, node.left), right: this[node.right.type](reducer, node.right), body: this[node.body.type](reducer, node.body) });
  },
  ForStatement: function ForStatement(reducer, node) {
    return reducer.reduceForStatement(node, { init: node.init && this[node.init.type](reducer, node.init), test: node.test && this[node.test.type](reducer, node.test), update: node.update && this[node.update.type](reducer, node.update), body: this[node.body.type](reducer, node.body) });
  },
  FormalParameters: function FormalParameters(reducer, node) {
    var _this10 = this;

    return reducer.reduceFormalParameters(node, { items: node.items.map(function (v) {
        return _this10[v.type](reducer, v);
      }), rest: node.rest && this[node.rest.type](reducer, node.rest) });
  },
  FunctionBody: function FunctionBody(reducer, node) {
    var _this11 = this;

    return reducer.reduceFunctionBody(node, { directives: node.directives.map(function (v) {
        return _this11.Directive(reducer, v);
      }), statements: node.statements.map(function (v) {
        return _this11[v.type](reducer, v);
      }) });
  },
  FunctionDeclaration: function FunctionDeclaration(reducer, node) {
    return reducer.reduceFunctionDeclaration(node, { name: this.BindingIdentifier(reducer, node.name), params: this.FormalParameters(reducer, node.params), body: this.FunctionBody(reducer, node.body) });
  },
  FunctionExpression: function FunctionExpression(reducer, node) {
    return reducer.reduceFunctionExpression(node, { name: node.name && this.BindingIdentifier(reducer, node.name), params: this.FormalParameters(reducer, node.params), body: this.FunctionBody(reducer, node.body) });
  },
  Getter: function Getter(reducer, node) {
    return reducer.reduceGetter(node, { name: this[node.name.type](reducer, node.name), body: this.FunctionBody(reducer, node.body) });
  },
  IdentifierExpression: function IdentifierExpression(reducer, node) {
    return reducer.reduceIdentifierExpression(node);
  },
  IfStatement: function IfStatement(reducer, node) {
    return reducer.reduceIfStatement(node, { test: this[node.test.type](reducer, node.test), consequent: this[node.consequent.type](reducer, node.consequent), alternate: node.alternate && this[node.alternate.type](reducer, node.alternate) });
  },
  Import: function Import(reducer, node) {
    var _this12 = this;

    return reducer.reduceImport(node, { defaultBinding: node.defaultBinding && this.BindingIdentifier(reducer, node.defaultBinding), namedImports: node.namedImports.map(function (v) {
        return _this12.ImportSpecifier(reducer, v);
      }) });
  },
  ImportNamespace: function ImportNamespace(reducer, node) {
    return reducer.reduceImportNamespace(node, { defaultBinding: node.defaultBinding && this.BindingIdentifier(reducer, node.defaultBinding), namespaceBinding: this.BindingIdentifier(reducer, node.namespaceBinding) });
  },
  ImportSpecifier: function ImportSpecifier(reducer, node) {
    return reducer.reduceImportSpecifier(node, { binding: this.BindingIdentifier(reducer, node.binding) });
  },
  LabeledStatement: function LabeledStatement(reducer, node) {
    return reducer.reduceLabeledStatement(node, { body: this[node.body.type](reducer, node.body) });
  },
  LiteralBooleanExpression: function LiteralBooleanExpression(reducer, node) {
    return reducer.reduceLiteralBooleanExpression(node);
  },
  LiteralInfinityExpression: function LiteralInfinityExpression(reducer, node) {
    return reducer.reduceLiteralInfinityExpression(node);
  },
  LiteralNullExpression: function LiteralNullExpression(reducer, node) {
    return reducer.reduceLiteralNullExpression(node);
  },
  LiteralNumericExpression: function LiteralNumericExpression(reducer, node) {
    return reducer.reduceLiteralNumericExpression(node);
  },
  LiteralRegExpExpression: function LiteralRegExpExpression(reducer, node) {
    return reducer.reduceLiteralRegExpExpression(node);
  },
  LiteralStringExpression: function LiteralStringExpression(reducer, node) {
    return reducer.reduceLiteralStringExpression(node);
  },
  Method: function Method(reducer, node) {
    return reducer.reduceMethod(node, { name: this[node.name.type](reducer, node.name), params: this.FormalParameters(reducer, node.params), body: this.FunctionBody(reducer, node.body) });
  },
  Module: function Module(reducer, node) {
    var _this13 = this;

    return reducer.reduceModule(node, { directives: node.directives.map(function (v) {
        return _this13.Directive(reducer, v);
      }), items: node.items.map(function (v) {
        return _this13[v.type](reducer, v);
      }) });
  },
  NewExpression: function NewExpression(reducer, node) {
    var _this14 = this;

    return reducer.reduceNewExpression(node, { callee: this[node.callee.type](reducer, node.callee), arguments: node.arguments.map(function (v) {
        return _this14[v.type](reducer, v);
      }) });
  },
  NewTargetExpression: function NewTargetExpression(reducer, node) {
    return reducer.reduceNewTargetExpression(node);
  },
  ObjectAssignmentTarget: function ObjectAssignmentTarget(reducer, node) {
    var _this15 = this;

    return reducer.reduceObjectAssignmentTarget(node, { properties: node.properties.map(function (v) {
        return _this15[v.type](reducer, v);
      }), rest: node.rest && this[node.rest.type](reducer, node.rest) });
  },
  ObjectBinding: function ObjectBinding(reducer, node) {
    var _this16 = this;

    return reducer.reduceObjectBinding(node, { properties: node.properties.map(function (v) {
        return _this16[v.type](reducer, v);
      }), rest: node.rest && this[node.rest.type](reducer, node.rest) });
  },
  ObjectExpression: function ObjectExpression(reducer, node) {
    var _this17 = this;

    return reducer.reduceObjectExpression(node, { properties: node.properties.map(function (v) {
        return _this17[v.type](reducer, v);
      }) });
  },
  ReturnStatement: function ReturnStatement(reducer, node) {
    return reducer.reduceReturnStatement(node, { expression: node.expression && this[node.expression.type](reducer, node.expression) });
  },
  Script: function Script(reducer, node) {
    var _this18 = this;

    return reducer.reduceScript(node, { directives: node.directives.map(function (v) {
        return _this18.Directive(reducer, v);
      }), statements: node.statements.map(function (v) {
        return _this18[v.type](reducer, v);
      }) });
  },
  Setter: function Setter(reducer, node) {
    return reducer.reduceSetter(node, { name: this[node.name.type](reducer, node.name), param: this[node.param.type](reducer, node.param), body: this.FunctionBody(reducer, node.body) });
  },
  ShorthandProperty: function ShorthandProperty(reducer, node) {
    return reducer.reduceShorthandProperty(node, { name: this.IdentifierExpression(reducer, node.name) });
  },
  SpreadElement: function SpreadElement(reducer, node) {
    return reducer.reduceSpreadElement(node, { expression: this[node.expression.type](reducer, node.expression) });
  },
  SpreadProperty: function SpreadProperty(reducer, node) {
    return reducer.reduceSpreadProperty(node, { expression: this[node.expression.type](reducer, node.expression) });
  },
  StaticMemberAssignmentTarget: function StaticMemberAssignmentTarget(reducer, node) {
    return reducer.reduceStaticMemberAssignmentTarget(node, { object: this[node.object.type](reducer, node.object) });
  },
  StaticMemberExpression: function StaticMemberExpression(reducer, node) {
    return reducer.reduceStaticMemberExpression(node, { object: this[node.object.type](reducer, node.object) });
  },
  StaticPropertyName: function StaticPropertyName(reducer, node) {
    return reducer.reduceStaticPropertyName(node);
  },
  Super: function Super(reducer, node) {
    return reducer.reduceSuper(node);
  },
  SwitchCase: function SwitchCase(reducer, node) {
    var _this19 = this;

    return reducer.reduceSwitchCase(node, { test: this[node.test.type](reducer, node.test), consequent: node.consequent.map(function (v) {
        return _this19[v.type](reducer, v);
      }) });
  },
  SwitchDefault: function SwitchDefault(reducer, node) {
    var _this20 = this;

    return reducer.reduceSwitchDefault(node, { consequent: node.consequent.map(function (v) {
        return _this20[v.type](reducer, v);
      }) });
  },
  SwitchStatement: function SwitchStatement(reducer, node) {
    var _this21 = this;

    return reducer.reduceSwitchStatement(node, { discriminant: this[node.discriminant.type](reducer, node.discriminant), cases: node.cases.map(function (v) {
        return _this21.SwitchCase(reducer, v);
      }) });
  },
  SwitchStatementWithDefault: function SwitchStatementWithDefault(reducer, node) {
    var _this22 = this;

    return reducer.reduceSwitchStatementWithDefault(node, { discriminant: this[node.discriminant.type](reducer, node.discriminant), preDefaultCases: node.preDefaultCases.map(function (v) {
        return _this22.SwitchCase(reducer, v);
      }), defaultCase: this.SwitchDefault(reducer, node.defaultCase), postDefaultCases: node.postDefaultCases.map(function (v) {
        return _this22.SwitchCase(reducer, v);
      }) });
  },
  TemplateElement: function TemplateElement(reducer, node) {
    return reducer.reduceTemplateElement(node);
  },
  TemplateExpression: function TemplateExpression(reducer, node) {
    var _this23 = this;

    return reducer.reduceTemplateExpression(node, { tag: node.tag && this[node.tag.type](reducer, node.tag), elements: node.elements.map(function (v) {
        return _this23[v.type](reducer, v);
      }) });
  },
  ThisExpression: function ThisExpression(reducer, node) {
    return reducer.reduceThisExpression(node);
  },
  ThrowStatement: function ThrowStatement(reducer, node) {
    return reducer.reduceThrowStatement(node, { expression: this[node.expression.type](reducer, node.expression) });
  },
  TryCatchStatement: function TryCatchStatement(reducer, node) {
    return reducer.reduceTryCatchStatement(node, { body: this.Block(reducer, node.body), catchClause: this.CatchClause(reducer, node.catchClause) });
  },
  TryFinallyStatement: function TryFinallyStatement(reducer, node) {
    return reducer.reduceTryFinallyStatement(node, { body: this.Block(reducer, node.body), catchClause: node.catchClause && this.CatchClause(reducer, node.catchClause), finalizer: this.Block(reducer, node.finalizer) });
  },
  UnaryExpression: function UnaryExpression(reducer, node) {
    return reducer.reduceUnaryExpression(node, { operand: this[node.operand.type](reducer, node.operand) });
  },
  UpdateExpression: function UpdateExpression(reducer, node) {
    return reducer.reduceUpdateExpression(node, { operand: this[node.operand.type](reducer, node.operand) });
  },
  VariableDeclaration: function VariableDeclaration(reducer, node) {
    var _this24 = this;

    return reducer.reduceVariableDeclaration(node, { declarators: node.declarators.map(function (v) {
        return _this24.VariableDeclarator(reducer, v);
      }) });
  },
  VariableDeclarationStatement: function VariableDeclarationStatement(reducer, node) {
    return reducer.reduceVariableDeclarationStatement(node, { declaration: this.VariableDeclaration(reducer, node.declaration) });
  },
  VariableDeclarator: function VariableDeclarator(reducer, node) {
    return reducer.reduceVariableDeclarator(node, { binding: this[node.binding.type](reducer, node.binding), init: node.init && this[node.init.type](reducer, node.init) });
  },
  WhileStatement: function WhileStatement(reducer, node) {
    return reducer.reduceWhileStatement(node, { test: this[node.test.type](reducer, node.test), body: this[node.body.type](reducer, node.body) });
  },
  WithStatement: function WithStatement(reducer, node) {
    return reducer.reduceWithStatement(node, { object: this[node.object.type](reducer, node.object), body: this[node.body.type](reducer, node.body) });
  },
  YieldExpression: function YieldExpression(reducer, node) {
    return reducer.reduceYieldExpression(node, { expression: node.expression && this[node.expression.type](reducer, node.expression) });
  },
  YieldGeneratorExpression: function YieldGeneratorExpression(reducer, node) {
    return reducer.reduceYieldGeneratorExpression(node, { expression: this[node.expression.type](reducer, node.expression) });
  }
};

function reduce(reducer, node) {
  return director[node.type](reducer, node);
}
});

var thunkedDirector = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.thunkedReduce = thunkedReduce;
// Generated by generate-director.js
/**
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

var director = {
  ArrayAssignmentTarget: function ArrayAssignmentTarget(reducer, node) {
    var _this = this;

    return reducer.reduceArrayAssignmentTarget(node, { elements: node.elements.map(function (v) {
        return v && function () {
          return _this[v.type](reducer, v);
        };
      }), rest: node.rest && function () {
        return _this[node.rest.type](reducer, node.rest);
      } });
  },
  ArrayBinding: function ArrayBinding(reducer, node) {
    var _this2 = this;

    return reducer.reduceArrayBinding(node, { elements: node.elements.map(function (v) {
        return v && function () {
          return _this2[v.type](reducer, v);
        };
      }), rest: node.rest && function () {
        return _this2[node.rest.type](reducer, node.rest);
      } });
  },
  ArrayExpression: function ArrayExpression(reducer, node) {
    var _this3 = this;

    return reducer.reduceArrayExpression(node, { elements: node.elements.map(function (v) {
        return v && function () {
          return _this3[v.type](reducer, v);
        };
      }) });
  },
  ArrowExpression: function ArrowExpression(reducer, node) {
    var _this4 = this;

    return reducer.reduceArrowExpression(node, { params: function params() {
        return _this4.FormalParameters(reducer, node.params);
      }, body: function body() {
        return _this4[node.body.type](reducer, node.body);
      } });
  },
  AssignmentExpression: function AssignmentExpression(reducer, node) {
    var _this5 = this;

    return reducer.reduceAssignmentExpression(node, { binding: function binding() {
        return _this5[node.binding.type](reducer, node.binding);
      }, expression: function expression() {
        return _this5[node.expression.type](reducer, node.expression);
      } });
  },
  AssignmentTargetIdentifier: function AssignmentTargetIdentifier(reducer, node) {
    return reducer.reduceAssignmentTargetIdentifier(node);
  },
  AssignmentTargetPropertyIdentifier: function AssignmentTargetPropertyIdentifier(reducer, node) {
    var _this6 = this;

    return reducer.reduceAssignmentTargetPropertyIdentifier(node, { binding: function binding() {
        return _this6.AssignmentTargetIdentifier(reducer, node.binding);
      }, init: node.init && function () {
        return _this6[node.init.type](reducer, node.init);
      } });
  },
  AssignmentTargetPropertyProperty: function AssignmentTargetPropertyProperty(reducer, node) {
    var _this7 = this;

    return reducer.reduceAssignmentTargetPropertyProperty(node, { name: function name() {
        return _this7[node.name.type](reducer, node.name);
      }, binding: function binding() {
        return _this7[node.binding.type](reducer, node.binding);
      } });
  },
  AssignmentTargetWithDefault: function AssignmentTargetWithDefault(reducer, node) {
    var _this8 = this;

    return reducer.reduceAssignmentTargetWithDefault(node, { binding: function binding() {
        return _this8[node.binding.type](reducer, node.binding);
      }, init: function init() {
        return _this8[node.init.type](reducer, node.init);
      } });
  },
  AwaitExpression: function AwaitExpression(reducer, node) {
    var _this9 = this;

    return reducer.reduceAwaitExpression(node, { expression: function expression() {
        return _this9[node.expression.type](reducer, node.expression);
      } });
  },
  BinaryExpression: function BinaryExpression(reducer, node) {
    var _this10 = this;

    return reducer.reduceBinaryExpression(node, { left: function left() {
        return _this10[node.left.type](reducer, node.left);
      }, right: function right() {
        return _this10[node.right.type](reducer, node.right);
      } });
  },
  BindingIdentifier: function BindingIdentifier(reducer, node) {
    return reducer.reduceBindingIdentifier(node);
  },
  BindingPropertyIdentifier: function BindingPropertyIdentifier(reducer, node) {
    var _this11 = this;

    return reducer.reduceBindingPropertyIdentifier(node, { binding: function binding() {
        return _this11.BindingIdentifier(reducer, node.binding);
      }, init: node.init && function () {
        return _this11[node.init.type](reducer, node.init);
      } });
  },
  BindingPropertyProperty: function BindingPropertyProperty(reducer, node) {
    var _this12 = this;

    return reducer.reduceBindingPropertyProperty(node, { name: function name() {
        return _this12[node.name.type](reducer, node.name);
      }, binding: function binding() {
        return _this12[node.binding.type](reducer, node.binding);
      } });
  },
  BindingWithDefault: function BindingWithDefault(reducer, node) {
    var _this13 = this;

    return reducer.reduceBindingWithDefault(node, { binding: function binding() {
        return _this13[node.binding.type](reducer, node.binding);
      }, init: function init() {
        return _this13[node.init.type](reducer, node.init);
      } });
  },
  Block: function Block(reducer, node) {
    var _this14 = this;

    return reducer.reduceBlock(node, { statements: node.statements.map(function (v) {
        return function () {
          return _this14[v.type](reducer, v);
        };
      }) });
  },
  BlockStatement: function BlockStatement(reducer, node) {
    var _this15 = this;

    return reducer.reduceBlockStatement(node, { block: function block() {
        return _this15.Block(reducer, node.block);
      } });
  },
  BreakStatement: function BreakStatement(reducer, node) {
    return reducer.reduceBreakStatement(node);
  },
  CallExpression: function CallExpression(reducer, node) {
    var _this16 = this;

    return reducer.reduceCallExpression(node, { callee: function callee() {
        return _this16[node.callee.type](reducer, node.callee);
      }, arguments: node.arguments.map(function (v) {
        return function () {
          return _this16[v.type](reducer, v);
        };
      }) });
  },
  CatchClause: function CatchClause(reducer, node) {
    var _this17 = this;

    return reducer.reduceCatchClause(node, { binding: function binding() {
        return _this17[node.binding.type](reducer, node.binding);
      }, body: function body() {
        return _this17.Block(reducer, node.body);
      } });
  },
  ClassDeclaration: function ClassDeclaration(reducer, node) {
    var _this18 = this;

    return reducer.reduceClassDeclaration(node, { name: function name() {
        return _this18.BindingIdentifier(reducer, node.name);
      }, super: node.super && function () {
        return _this18[node.super.type](reducer, node.super);
      }, elements: node.elements.map(function (v) {
        return function () {
          return _this18.ClassElement(reducer, v);
        };
      }) });
  },
  ClassElement: function ClassElement(reducer, node) {
    var _this19 = this;

    return reducer.reduceClassElement(node, { method: function method() {
        return _this19[node.method.type](reducer, node.method);
      } });
  },
  ClassExpression: function ClassExpression(reducer, node) {
    var _this20 = this;

    return reducer.reduceClassExpression(node, { name: node.name && function () {
        return _this20.BindingIdentifier(reducer, node.name);
      }, super: node.super && function () {
        return _this20[node.super.type](reducer, node.super);
      }, elements: node.elements.map(function (v) {
        return function () {
          return _this20.ClassElement(reducer, v);
        };
      }) });
  },
  CompoundAssignmentExpression: function CompoundAssignmentExpression(reducer, node) {
    var _this21 = this;

    return reducer.reduceCompoundAssignmentExpression(node, { binding: function binding() {
        return _this21[node.binding.type](reducer, node.binding);
      }, expression: function expression() {
        return _this21[node.expression.type](reducer, node.expression);
      } });
  },
  ComputedMemberAssignmentTarget: function ComputedMemberAssignmentTarget(reducer, node) {
    var _this22 = this;

    return reducer.reduceComputedMemberAssignmentTarget(node, { object: function object() {
        return _this22[node.object.type](reducer, node.object);
      }, expression: function expression() {
        return _this22[node.expression.type](reducer, node.expression);
      } });
  },
  ComputedMemberExpression: function ComputedMemberExpression(reducer, node) {
    var _this23 = this;

    return reducer.reduceComputedMemberExpression(node, { object: function object() {
        return _this23[node.object.type](reducer, node.object);
      }, expression: function expression() {
        return _this23[node.expression.type](reducer, node.expression);
      } });
  },
  ComputedPropertyName: function ComputedPropertyName(reducer, node) {
    var _this24 = this;

    return reducer.reduceComputedPropertyName(node, { expression: function expression() {
        return _this24[node.expression.type](reducer, node.expression);
      } });
  },
  ConditionalExpression: function ConditionalExpression(reducer, node) {
    var _this25 = this;

    return reducer.reduceConditionalExpression(node, { test: function test() {
        return _this25[node.test.type](reducer, node.test);
      }, consequent: function consequent() {
        return _this25[node.consequent.type](reducer, node.consequent);
      }, alternate: function alternate() {
        return _this25[node.alternate.type](reducer, node.alternate);
      } });
  },
  ContinueStatement: function ContinueStatement(reducer, node) {
    return reducer.reduceContinueStatement(node);
  },
  DataProperty: function DataProperty(reducer, node) {
    var _this26 = this;

    return reducer.reduceDataProperty(node, { name: function name() {
        return _this26[node.name.type](reducer, node.name);
      }, expression: function expression() {
        return _this26[node.expression.type](reducer, node.expression);
      } });
  },
  DebuggerStatement: function DebuggerStatement(reducer, node) {
    return reducer.reduceDebuggerStatement(node);
  },
  Directive: function Directive(reducer, node) {
    return reducer.reduceDirective(node);
  },
  DoWhileStatement: function DoWhileStatement(reducer, node) {
    var _this27 = this;

    return reducer.reduceDoWhileStatement(node, { body: function body() {
        return _this27[node.body.type](reducer, node.body);
      }, test: function test() {
        return _this27[node.test.type](reducer, node.test);
      } });
  },
  EmptyStatement: function EmptyStatement(reducer, node) {
    return reducer.reduceEmptyStatement(node);
  },
  Export: function Export(reducer, node) {
    var _this28 = this;

    return reducer.reduceExport(node, { declaration: function declaration() {
        return _this28[node.declaration.type](reducer, node.declaration);
      } });
  },
  ExportAllFrom: function ExportAllFrom(reducer, node) {
    return reducer.reduceExportAllFrom(node);
  },
  ExportDefault: function ExportDefault(reducer, node) {
    var _this29 = this;

    return reducer.reduceExportDefault(node, { body: function body() {
        return _this29[node.body.type](reducer, node.body);
      } });
  },
  ExportFrom: function ExportFrom(reducer, node) {
    var _this30 = this;

    return reducer.reduceExportFrom(node, { namedExports: node.namedExports.map(function (v) {
        return function () {
          return _this30.ExportFromSpecifier(reducer, v);
        };
      }) });
  },
  ExportFromSpecifier: function ExportFromSpecifier(reducer, node) {
    return reducer.reduceExportFromSpecifier(node);
  },
  ExportLocalSpecifier: function ExportLocalSpecifier(reducer, node) {
    var _this31 = this;

    return reducer.reduceExportLocalSpecifier(node, { name: function name() {
        return _this31.IdentifierExpression(reducer, node.name);
      } });
  },
  ExportLocals: function ExportLocals(reducer, node) {
    var _this32 = this;

    return reducer.reduceExportLocals(node, { namedExports: node.namedExports.map(function (v) {
        return function () {
          return _this32.ExportLocalSpecifier(reducer, v);
        };
      }) });
  },
  ExpressionStatement: function ExpressionStatement(reducer, node) {
    var _this33 = this;

    return reducer.reduceExpressionStatement(node, { expression: function expression() {
        return _this33[node.expression.type](reducer, node.expression);
      } });
  },
  ForAwaitStatement: function ForAwaitStatement(reducer, node) {
    var _this34 = this;

    return reducer.reduceForAwaitStatement(node, { left: function left() {
        return _this34[node.left.type](reducer, node.left);
      }, right: function right() {
        return _this34[node.right.type](reducer, node.right);
      }, body: function body() {
        return _this34[node.body.type](reducer, node.body);
      } });
  },
  ForInStatement: function ForInStatement(reducer, node) {
    var _this35 = this;

    return reducer.reduceForInStatement(node, { left: function left() {
        return _this35[node.left.type](reducer, node.left);
      }, right: function right() {
        return _this35[node.right.type](reducer, node.right);
      }, body: function body() {
        return _this35[node.body.type](reducer, node.body);
      } });
  },
  ForOfStatement: function ForOfStatement(reducer, node) {
    var _this36 = this;

    return reducer.reduceForOfStatement(node, { left: function left() {
        return _this36[node.left.type](reducer, node.left);
      }, right: function right() {
        return _this36[node.right.type](reducer, node.right);
      }, body: function body() {
        return _this36[node.body.type](reducer, node.body);
      } });
  },
  ForStatement: function ForStatement(reducer, node) {
    var _this37 = this;

    return reducer.reduceForStatement(node, { init: node.init && function () {
        return _this37[node.init.type](reducer, node.init);
      }, test: node.test && function () {
        return _this37[node.test.type](reducer, node.test);
      }, update: node.update && function () {
        return _this37[node.update.type](reducer, node.update);
      }, body: function body() {
        return _this37[node.body.type](reducer, node.body);
      } });
  },
  FormalParameters: function FormalParameters(reducer, node) {
    var _this38 = this;

    return reducer.reduceFormalParameters(node, { items: node.items.map(function (v) {
        return function () {
          return _this38[v.type](reducer, v);
        };
      }), rest: node.rest && function () {
        return _this38[node.rest.type](reducer, node.rest);
      } });
  },
  FunctionBody: function FunctionBody(reducer, node) {
    var _this39 = this;

    return reducer.reduceFunctionBody(node, { directives: node.directives.map(function (v) {
        return function () {
          return _this39.Directive(reducer, v);
        };
      }), statements: node.statements.map(function (v) {
        return function () {
          return _this39[v.type](reducer, v);
        };
      }) });
  },
  FunctionDeclaration: function FunctionDeclaration(reducer, node) {
    var _this40 = this;

    return reducer.reduceFunctionDeclaration(node, { name: function name() {
        return _this40.BindingIdentifier(reducer, node.name);
      }, params: function params() {
        return _this40.FormalParameters(reducer, node.params);
      }, body: function body() {
        return _this40.FunctionBody(reducer, node.body);
      } });
  },
  FunctionExpression: function FunctionExpression(reducer, node) {
    var _this41 = this;

    return reducer.reduceFunctionExpression(node, { name: node.name && function () {
        return _this41.BindingIdentifier(reducer, node.name);
      }, params: function params() {
        return _this41.FormalParameters(reducer, node.params);
      }, body: function body() {
        return _this41.FunctionBody(reducer, node.body);
      } });
  },
  Getter: function Getter(reducer, node) {
    var _this42 = this;

    return reducer.reduceGetter(node, { name: function name() {
        return _this42[node.name.type](reducer, node.name);
      }, body: function body() {
        return _this42.FunctionBody(reducer, node.body);
      } });
  },
  IdentifierExpression: function IdentifierExpression(reducer, node) {
    return reducer.reduceIdentifierExpression(node);
  },
  IfStatement: function IfStatement(reducer, node) {
    var _this43 = this;

    return reducer.reduceIfStatement(node, { test: function test() {
        return _this43[node.test.type](reducer, node.test);
      }, consequent: function consequent() {
        return _this43[node.consequent.type](reducer, node.consequent);
      }, alternate: node.alternate && function () {
        return _this43[node.alternate.type](reducer, node.alternate);
      } });
  },
  Import: function Import(reducer, node) {
    var _this44 = this;

    return reducer.reduceImport(node, { defaultBinding: node.defaultBinding && function () {
        return _this44.BindingIdentifier(reducer, node.defaultBinding);
      }, namedImports: node.namedImports.map(function (v) {
        return function () {
          return _this44.ImportSpecifier(reducer, v);
        };
      }) });
  },
  ImportNamespace: function ImportNamespace(reducer, node) {
    var _this45 = this;

    return reducer.reduceImportNamespace(node, { defaultBinding: node.defaultBinding && function () {
        return _this45.BindingIdentifier(reducer, node.defaultBinding);
      }, namespaceBinding: function namespaceBinding() {
        return _this45.BindingIdentifier(reducer, node.namespaceBinding);
      } });
  },
  ImportSpecifier: function ImportSpecifier(reducer, node) {
    var _this46 = this;

    return reducer.reduceImportSpecifier(node, { binding: function binding() {
        return _this46.BindingIdentifier(reducer, node.binding);
      } });
  },
  LabeledStatement: function LabeledStatement(reducer, node) {
    var _this47 = this;

    return reducer.reduceLabeledStatement(node, { body: function body() {
        return _this47[node.body.type](reducer, node.body);
      } });
  },
  LiteralBooleanExpression: function LiteralBooleanExpression(reducer, node) {
    return reducer.reduceLiteralBooleanExpression(node);
  },
  LiteralInfinityExpression: function LiteralInfinityExpression(reducer, node) {
    return reducer.reduceLiteralInfinityExpression(node);
  },
  LiteralNullExpression: function LiteralNullExpression(reducer, node) {
    return reducer.reduceLiteralNullExpression(node);
  },
  LiteralNumericExpression: function LiteralNumericExpression(reducer, node) {
    return reducer.reduceLiteralNumericExpression(node);
  },
  LiteralRegExpExpression: function LiteralRegExpExpression(reducer, node) {
    return reducer.reduceLiteralRegExpExpression(node);
  },
  LiteralStringExpression: function LiteralStringExpression(reducer, node) {
    return reducer.reduceLiteralStringExpression(node);
  },
  Method: function Method(reducer, node) {
    var _this48 = this;

    return reducer.reduceMethod(node, { name: function name() {
        return _this48[node.name.type](reducer, node.name);
      }, params: function params() {
        return _this48.FormalParameters(reducer, node.params);
      }, body: function body() {
        return _this48.FunctionBody(reducer, node.body);
      } });
  },
  Module: function Module(reducer, node) {
    var _this49 = this;

    return reducer.reduceModule(node, { directives: node.directives.map(function (v) {
        return function () {
          return _this49.Directive(reducer, v);
        };
      }), items: node.items.map(function (v) {
        return function () {
          return _this49[v.type](reducer, v);
        };
      }) });
  },
  NewExpression: function NewExpression(reducer, node) {
    var _this50 = this;

    return reducer.reduceNewExpression(node, { callee: function callee() {
        return _this50[node.callee.type](reducer, node.callee);
      }, arguments: node.arguments.map(function (v) {
        return function () {
          return _this50[v.type](reducer, v);
        };
      }) });
  },
  NewTargetExpression: function NewTargetExpression(reducer, node) {
    return reducer.reduceNewTargetExpression(node);
  },
  ObjectAssignmentTarget: function ObjectAssignmentTarget(reducer, node) {
    var _this51 = this;

    return reducer.reduceObjectAssignmentTarget(node, { properties: node.properties.map(function (v) {
        return function () {
          return _this51[v.type](reducer, v);
        };
      }), rest: node.rest && function () {
        return _this51[node.rest.type](reducer, node.rest);
      } });
  },
  ObjectBinding: function ObjectBinding(reducer, node) {
    var _this52 = this;

    return reducer.reduceObjectBinding(node, { properties: node.properties.map(function (v) {
        return function () {
          return _this52[v.type](reducer, v);
        };
      }), rest: node.rest && function () {
        return _this52[node.rest.type](reducer, node.rest);
      } });
  },
  ObjectExpression: function ObjectExpression(reducer, node) {
    var _this53 = this;

    return reducer.reduceObjectExpression(node, { properties: node.properties.map(function (v) {
        return function () {
          return _this53[v.type](reducer, v);
        };
      }) });
  },
  ReturnStatement: function ReturnStatement(reducer, node) {
    var _this54 = this;

    return reducer.reduceReturnStatement(node, { expression: node.expression && function () {
        return _this54[node.expression.type](reducer, node.expression);
      } });
  },
  Script: function Script(reducer, node) {
    var _this55 = this;

    return reducer.reduceScript(node, { directives: node.directives.map(function (v) {
        return function () {
          return _this55.Directive(reducer, v);
        };
      }), statements: node.statements.map(function (v) {
        return function () {
          return _this55[v.type](reducer, v);
        };
      }) });
  },
  Setter: function Setter(reducer, node) {
    var _this56 = this;

    return reducer.reduceSetter(node, { name: function name() {
        return _this56[node.name.type](reducer, node.name);
      }, param: function param() {
        return _this56[node.param.type](reducer, node.param);
      }, body: function body() {
        return _this56.FunctionBody(reducer, node.body);
      } });
  },
  ShorthandProperty: function ShorthandProperty(reducer, node) {
    var _this57 = this;

    return reducer.reduceShorthandProperty(node, { name: function name() {
        return _this57.IdentifierExpression(reducer, node.name);
      } });
  },
  SpreadElement: function SpreadElement(reducer, node) {
    var _this58 = this;

    return reducer.reduceSpreadElement(node, { expression: function expression() {
        return _this58[node.expression.type](reducer, node.expression);
      } });
  },
  SpreadProperty: function SpreadProperty(reducer, node) {
    var _this59 = this;

    return reducer.reduceSpreadProperty(node, { expression: function expression() {
        return _this59[node.expression.type](reducer, node.expression);
      } });
  },
  StaticMemberAssignmentTarget: function StaticMemberAssignmentTarget(reducer, node) {
    var _this60 = this;

    return reducer.reduceStaticMemberAssignmentTarget(node, { object: function object() {
        return _this60[node.object.type](reducer, node.object);
      } });
  },
  StaticMemberExpression: function StaticMemberExpression(reducer, node) {
    var _this61 = this;

    return reducer.reduceStaticMemberExpression(node, { object: function object() {
        return _this61[node.object.type](reducer, node.object);
      } });
  },
  StaticPropertyName: function StaticPropertyName(reducer, node) {
    return reducer.reduceStaticPropertyName(node);
  },
  Super: function Super(reducer, node) {
    return reducer.reduceSuper(node);
  },
  SwitchCase: function SwitchCase(reducer, node) {
    var _this62 = this;

    return reducer.reduceSwitchCase(node, { test: function test() {
        return _this62[node.test.type](reducer, node.test);
      }, consequent: node.consequent.map(function (v) {
        return function () {
          return _this62[v.type](reducer, v);
        };
      }) });
  },
  SwitchDefault: function SwitchDefault(reducer, node) {
    var _this63 = this;

    return reducer.reduceSwitchDefault(node, { consequent: node.consequent.map(function (v) {
        return function () {
          return _this63[v.type](reducer, v);
        };
      }) });
  },
  SwitchStatement: function SwitchStatement(reducer, node) {
    var _this64 = this;

    return reducer.reduceSwitchStatement(node, { discriminant: function discriminant() {
        return _this64[node.discriminant.type](reducer, node.discriminant);
      }, cases: node.cases.map(function (v) {
        return function () {
          return _this64.SwitchCase(reducer, v);
        };
      }) });
  },
  SwitchStatementWithDefault: function SwitchStatementWithDefault(reducer, node) {
    var _this65 = this;

    return reducer.reduceSwitchStatementWithDefault(node, { discriminant: function discriminant() {
        return _this65[node.discriminant.type](reducer, node.discriminant);
      }, preDefaultCases: node.preDefaultCases.map(function (v) {
        return function () {
          return _this65.SwitchCase(reducer, v);
        };
      }), defaultCase: function defaultCase() {
        return _this65.SwitchDefault(reducer, node.defaultCase);
      }, postDefaultCases: node.postDefaultCases.map(function (v) {
        return function () {
          return _this65.SwitchCase(reducer, v);
        };
      }) });
  },
  TemplateElement: function TemplateElement(reducer, node) {
    return reducer.reduceTemplateElement(node);
  },
  TemplateExpression: function TemplateExpression(reducer, node) {
    var _this66 = this;

    return reducer.reduceTemplateExpression(node, { tag: node.tag && function () {
        return _this66[node.tag.type](reducer, node.tag);
      }, elements: node.elements.map(function (v) {
        return function () {
          return _this66[v.type](reducer, v);
        };
      }) });
  },
  ThisExpression: function ThisExpression(reducer, node) {
    return reducer.reduceThisExpression(node);
  },
  ThrowStatement: function ThrowStatement(reducer, node) {
    var _this67 = this;

    return reducer.reduceThrowStatement(node, { expression: function expression() {
        return _this67[node.expression.type](reducer, node.expression);
      } });
  },
  TryCatchStatement: function TryCatchStatement(reducer, node) {
    var _this68 = this;

    return reducer.reduceTryCatchStatement(node, { body: function body() {
        return _this68.Block(reducer, node.body);
      }, catchClause: function catchClause() {
        return _this68.CatchClause(reducer, node.catchClause);
      } });
  },
  TryFinallyStatement: function TryFinallyStatement(reducer, node) {
    var _this69 = this;

    return reducer.reduceTryFinallyStatement(node, { body: function body() {
        return _this69.Block(reducer, node.body);
      }, catchClause: node.catchClause && function () {
        return _this69.CatchClause(reducer, node.catchClause);
      }, finalizer: function finalizer() {
        return _this69.Block(reducer, node.finalizer);
      } });
  },
  UnaryExpression: function UnaryExpression(reducer, node) {
    var _this70 = this;

    return reducer.reduceUnaryExpression(node, { operand: function operand() {
        return _this70[node.operand.type](reducer, node.operand);
      } });
  },
  UpdateExpression: function UpdateExpression(reducer, node) {
    var _this71 = this;

    return reducer.reduceUpdateExpression(node, { operand: function operand() {
        return _this71[node.operand.type](reducer, node.operand);
      } });
  },
  VariableDeclaration: function VariableDeclaration(reducer, node) {
    var _this72 = this;

    return reducer.reduceVariableDeclaration(node, { declarators: node.declarators.map(function (v) {
        return function () {
          return _this72.VariableDeclarator(reducer, v);
        };
      }) });
  },
  VariableDeclarationStatement: function VariableDeclarationStatement(reducer, node) {
    var _this73 = this;

    return reducer.reduceVariableDeclarationStatement(node, { declaration: function declaration() {
        return _this73.VariableDeclaration(reducer, node.declaration);
      } });
  },
  VariableDeclarator: function VariableDeclarator(reducer, node) {
    var _this74 = this;

    return reducer.reduceVariableDeclarator(node, { binding: function binding() {
        return _this74[node.binding.type](reducer, node.binding);
      }, init: node.init && function () {
        return _this74[node.init.type](reducer, node.init);
      } });
  },
  WhileStatement: function WhileStatement(reducer, node) {
    var _this75 = this;

    return reducer.reduceWhileStatement(node, { test: function test() {
        return _this75[node.test.type](reducer, node.test);
      }, body: function body() {
        return _this75[node.body.type](reducer, node.body);
      } });
  },
  WithStatement: function WithStatement(reducer, node) {
    var _this76 = this;

    return reducer.reduceWithStatement(node, { object: function object() {
        return _this76[node.object.type](reducer, node.object);
      }, body: function body() {
        return _this76[node.body.type](reducer, node.body);
      } });
  },
  YieldExpression: function YieldExpression(reducer, node) {
    var _this77 = this;

    return reducer.reduceYieldExpression(node, { expression: node.expression && function () {
        return _this77[node.expression.type](reducer, node.expression);
      } });
  },
  YieldGeneratorExpression: function YieldGeneratorExpression(reducer, node) {
    var _this78 = this;

    return reducer.reduceYieldGeneratorExpression(node, { expression: function expression() {
        return _this78[node.expression.type](reducer, node.expression);
      } });
  }
};

function thunkedReduce(reducer, node) {
  return director[node.type](reducer, node);
}
});

var thunkify_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = thunkify;
// Generated by generate-thunkify.js
/**
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

function thunkify(reducer) {
  return {
    reduceArrayAssignmentTarget: function reduceArrayAssignmentTarget(node, _ref) {
      var elements = _ref.elements,
          rest = _ref.rest;

      return reducer.reduceArrayAssignmentTarget(node, { elements: elements.map(function (n) {
          return n == null ? null : n();
        }), rest: rest == null ? null : rest() });
    },
    reduceArrayBinding: function reduceArrayBinding(node, _ref2) {
      var elements = _ref2.elements,
          rest = _ref2.rest;

      return reducer.reduceArrayBinding(node, { elements: elements.map(function (n) {
          return n == null ? null : n();
        }), rest: rest == null ? null : rest() });
    },
    reduceArrayExpression: function reduceArrayExpression(node, _ref3) {
      var elements = _ref3.elements;

      return reducer.reduceArrayExpression(node, { elements: elements.map(function (n) {
          return n == null ? null : n();
        }) });
    },
    reduceArrowExpression: function reduceArrowExpression(node, _ref4) {
      var params = _ref4.params,
          body = _ref4.body;

      return reducer.reduceArrowExpression(node, { params: params(), body: body() });
    },
    reduceAssignmentExpression: function reduceAssignmentExpression(node, _ref5) {
      var binding = _ref5.binding,
          expression = _ref5.expression;

      return reducer.reduceAssignmentExpression(node, { binding: binding(), expression: expression() });
    },
    reduceAssignmentTargetIdentifier: function reduceAssignmentTargetIdentifier(node) {
      return reducer.reduceAssignmentTargetIdentifier(node);
    },
    reduceAssignmentTargetPropertyIdentifier: function reduceAssignmentTargetPropertyIdentifier(node, _ref6) {
      var binding = _ref6.binding,
          init = _ref6.init;

      return reducer.reduceAssignmentTargetPropertyIdentifier(node, { binding: binding(), init: init == null ? null : init() });
    },
    reduceAssignmentTargetPropertyProperty: function reduceAssignmentTargetPropertyProperty(node, _ref7) {
      var name = _ref7.name,
          binding = _ref7.binding;

      return reducer.reduceAssignmentTargetPropertyProperty(node, { name: name(), binding: binding() });
    },
    reduceAssignmentTargetWithDefault: function reduceAssignmentTargetWithDefault(node, _ref8) {
      var binding = _ref8.binding,
          init = _ref8.init;

      return reducer.reduceAssignmentTargetWithDefault(node, { binding: binding(), init: init() });
    },
    reduceAwaitExpression: function reduceAwaitExpression(node, _ref9) {
      var expression = _ref9.expression;

      return reducer.reduceAwaitExpression(node, { expression: expression() });
    },
    reduceBinaryExpression: function reduceBinaryExpression(node, _ref10) {
      var left = _ref10.left,
          right = _ref10.right;

      return reducer.reduceBinaryExpression(node, { left: left(), right: right() });
    },
    reduceBindingIdentifier: function reduceBindingIdentifier(node) {
      return reducer.reduceBindingIdentifier(node);
    },
    reduceBindingPropertyIdentifier: function reduceBindingPropertyIdentifier(node, _ref11) {
      var binding = _ref11.binding,
          init = _ref11.init;

      return reducer.reduceBindingPropertyIdentifier(node, { binding: binding(), init: init == null ? null : init() });
    },
    reduceBindingPropertyProperty: function reduceBindingPropertyProperty(node, _ref12) {
      var name = _ref12.name,
          binding = _ref12.binding;

      return reducer.reduceBindingPropertyProperty(node, { name: name(), binding: binding() });
    },
    reduceBindingWithDefault: function reduceBindingWithDefault(node, _ref13) {
      var binding = _ref13.binding,
          init = _ref13.init;

      return reducer.reduceBindingWithDefault(node, { binding: binding(), init: init() });
    },
    reduceBlock: function reduceBlock(node, _ref14) {
      var statements = _ref14.statements;

      return reducer.reduceBlock(node, { statements: statements.map(function (n) {
          return n();
        }) });
    },
    reduceBlockStatement: function reduceBlockStatement(node, _ref15) {
      var block = _ref15.block;

      return reducer.reduceBlockStatement(node, { block: block() });
    },
    reduceBreakStatement: function reduceBreakStatement(node) {
      return reducer.reduceBreakStatement(node);
    },
    reduceCallExpression: function reduceCallExpression(node, _ref16) {
      var callee = _ref16.callee,
          _arguments = _ref16.arguments;

      return reducer.reduceCallExpression(node, { callee: callee(), arguments: _arguments.map(function (n) {
          return n();
        }) });
    },
    reduceCatchClause: function reduceCatchClause(node, _ref17) {
      var binding = _ref17.binding,
          body = _ref17.body;

      return reducer.reduceCatchClause(node, { binding: binding(), body: body() });
    },
    reduceClassDeclaration: function reduceClassDeclaration(node, _ref18) {
      var name = _ref18.name,
          _super = _ref18.super,
          elements = _ref18.elements;

      return reducer.reduceClassDeclaration(node, { name: name(), super: _super == null ? null : _super(), elements: elements.map(function (n) {
          return n();
        }) });
    },
    reduceClassElement: function reduceClassElement(node, _ref19) {
      var method = _ref19.method;

      return reducer.reduceClassElement(node, { method: method() });
    },
    reduceClassExpression: function reduceClassExpression(node, _ref20) {
      var name = _ref20.name,
          _super = _ref20.super,
          elements = _ref20.elements;

      return reducer.reduceClassExpression(node, { name: name == null ? null : name(), super: _super == null ? null : _super(), elements: elements.map(function (n) {
          return n();
        }) });
    },
    reduceCompoundAssignmentExpression: function reduceCompoundAssignmentExpression(node, _ref21) {
      var binding = _ref21.binding,
          expression = _ref21.expression;

      return reducer.reduceCompoundAssignmentExpression(node, { binding: binding(), expression: expression() });
    },
    reduceComputedMemberAssignmentTarget: function reduceComputedMemberAssignmentTarget(node, _ref22) {
      var object = _ref22.object,
          expression = _ref22.expression;

      return reducer.reduceComputedMemberAssignmentTarget(node, { object: object(), expression: expression() });
    },
    reduceComputedMemberExpression: function reduceComputedMemberExpression(node, _ref23) {
      var object = _ref23.object,
          expression = _ref23.expression;

      return reducer.reduceComputedMemberExpression(node, { object: object(), expression: expression() });
    },
    reduceComputedPropertyName: function reduceComputedPropertyName(node, _ref24) {
      var expression = _ref24.expression;

      return reducer.reduceComputedPropertyName(node, { expression: expression() });
    },
    reduceConditionalExpression: function reduceConditionalExpression(node, _ref25) {
      var test = _ref25.test,
          consequent = _ref25.consequent,
          alternate = _ref25.alternate;

      return reducer.reduceConditionalExpression(node, { test: test(), consequent: consequent(), alternate: alternate() });
    },
    reduceContinueStatement: function reduceContinueStatement(node) {
      return reducer.reduceContinueStatement(node);
    },
    reduceDataProperty: function reduceDataProperty(node, _ref26) {
      var name = _ref26.name,
          expression = _ref26.expression;

      return reducer.reduceDataProperty(node, { name: name(), expression: expression() });
    },
    reduceDebuggerStatement: function reduceDebuggerStatement(node) {
      return reducer.reduceDebuggerStatement(node);
    },
    reduceDirective: function reduceDirective(node) {
      return reducer.reduceDirective(node);
    },
    reduceDoWhileStatement: function reduceDoWhileStatement(node, _ref27) {
      var body = _ref27.body,
          test = _ref27.test;

      return reducer.reduceDoWhileStatement(node, { body: body(), test: test() });
    },
    reduceEmptyStatement: function reduceEmptyStatement(node) {
      return reducer.reduceEmptyStatement(node);
    },
    reduceExport: function reduceExport(node, _ref28) {
      var declaration = _ref28.declaration;

      return reducer.reduceExport(node, { declaration: declaration() });
    },
    reduceExportAllFrom: function reduceExportAllFrom(node) {
      return reducer.reduceExportAllFrom(node);
    },
    reduceExportDefault: function reduceExportDefault(node, _ref29) {
      var body = _ref29.body;

      return reducer.reduceExportDefault(node, { body: body() });
    },
    reduceExportFrom: function reduceExportFrom(node, _ref30) {
      var namedExports = _ref30.namedExports;

      return reducer.reduceExportFrom(node, { namedExports: namedExports.map(function (n) {
          return n();
        }) });
    },
    reduceExportFromSpecifier: function reduceExportFromSpecifier(node) {
      return reducer.reduceExportFromSpecifier(node);
    },
    reduceExportLocalSpecifier: function reduceExportLocalSpecifier(node, _ref31) {
      var name = _ref31.name;

      return reducer.reduceExportLocalSpecifier(node, { name: name() });
    },
    reduceExportLocals: function reduceExportLocals(node, _ref32) {
      var namedExports = _ref32.namedExports;

      return reducer.reduceExportLocals(node, { namedExports: namedExports.map(function (n) {
          return n();
        }) });
    },
    reduceExpressionStatement: function reduceExpressionStatement(node, _ref33) {
      var expression = _ref33.expression;

      return reducer.reduceExpressionStatement(node, { expression: expression() });
    },
    reduceForAwaitStatement: function reduceForAwaitStatement(node, _ref34) {
      var left = _ref34.left,
          right = _ref34.right,
          body = _ref34.body;

      return reducer.reduceForAwaitStatement(node, { left: left(), right: right(), body: body() });
    },
    reduceForInStatement: function reduceForInStatement(node, _ref35) {
      var left = _ref35.left,
          right = _ref35.right,
          body = _ref35.body;

      return reducer.reduceForInStatement(node, { left: left(), right: right(), body: body() });
    },
    reduceForOfStatement: function reduceForOfStatement(node, _ref36) {
      var left = _ref36.left,
          right = _ref36.right,
          body = _ref36.body;

      return reducer.reduceForOfStatement(node, { left: left(), right: right(), body: body() });
    },
    reduceForStatement: function reduceForStatement(node, _ref37) {
      var init = _ref37.init,
          test = _ref37.test,
          update = _ref37.update,
          body = _ref37.body;

      return reducer.reduceForStatement(node, { init: init == null ? null : init(), test: test == null ? null : test(), update: update == null ? null : update(), body: body() });
    },
    reduceFormalParameters: function reduceFormalParameters(node, _ref38) {
      var items = _ref38.items,
          rest = _ref38.rest;

      return reducer.reduceFormalParameters(node, { items: items.map(function (n) {
          return n();
        }), rest: rest == null ? null : rest() });
    },
    reduceFunctionBody: function reduceFunctionBody(node, _ref39) {
      var directives = _ref39.directives,
          statements = _ref39.statements;

      return reducer.reduceFunctionBody(node, { directives: directives.map(function (n) {
          return n();
        }), statements: statements.map(function (n) {
          return n();
        }) });
    },
    reduceFunctionDeclaration: function reduceFunctionDeclaration(node, _ref40) {
      var name = _ref40.name,
          params = _ref40.params,
          body = _ref40.body;

      return reducer.reduceFunctionDeclaration(node, { name: name(), params: params(), body: body() });
    },
    reduceFunctionExpression: function reduceFunctionExpression(node, _ref41) {
      var name = _ref41.name,
          params = _ref41.params,
          body = _ref41.body;

      return reducer.reduceFunctionExpression(node, { name: name == null ? null : name(), params: params(), body: body() });
    },
    reduceGetter: function reduceGetter(node, _ref42) {
      var name = _ref42.name,
          body = _ref42.body;

      return reducer.reduceGetter(node, { name: name(), body: body() });
    },
    reduceIdentifierExpression: function reduceIdentifierExpression(node) {
      return reducer.reduceIdentifierExpression(node);
    },
    reduceIfStatement: function reduceIfStatement(node, _ref43) {
      var test = _ref43.test,
          consequent = _ref43.consequent,
          alternate = _ref43.alternate;

      return reducer.reduceIfStatement(node, { test: test(), consequent: consequent(), alternate: alternate == null ? null : alternate() });
    },
    reduceImport: function reduceImport(node, _ref44) {
      var defaultBinding = _ref44.defaultBinding,
          namedImports = _ref44.namedImports;

      return reducer.reduceImport(node, { defaultBinding: defaultBinding == null ? null : defaultBinding(), namedImports: namedImports.map(function (n) {
          return n();
        }) });
    },
    reduceImportNamespace: function reduceImportNamespace(node, _ref45) {
      var defaultBinding = _ref45.defaultBinding,
          namespaceBinding = _ref45.namespaceBinding;

      return reducer.reduceImportNamespace(node, { defaultBinding: defaultBinding == null ? null : defaultBinding(), namespaceBinding: namespaceBinding() });
    },
    reduceImportSpecifier: function reduceImportSpecifier(node, _ref46) {
      var binding = _ref46.binding;

      return reducer.reduceImportSpecifier(node, { binding: binding() });
    },
    reduceLabeledStatement: function reduceLabeledStatement(node, _ref47) {
      var body = _ref47.body;

      return reducer.reduceLabeledStatement(node, { body: body() });
    },
    reduceLiteralBooleanExpression: function reduceLiteralBooleanExpression(node) {
      return reducer.reduceLiteralBooleanExpression(node);
    },
    reduceLiteralInfinityExpression: function reduceLiteralInfinityExpression(node) {
      return reducer.reduceLiteralInfinityExpression(node);
    },
    reduceLiteralNullExpression: function reduceLiteralNullExpression(node) {
      return reducer.reduceLiteralNullExpression(node);
    },
    reduceLiteralNumericExpression: function reduceLiteralNumericExpression(node) {
      return reducer.reduceLiteralNumericExpression(node);
    },
    reduceLiteralRegExpExpression: function reduceLiteralRegExpExpression(node) {
      return reducer.reduceLiteralRegExpExpression(node);
    },
    reduceLiteralStringExpression: function reduceLiteralStringExpression(node) {
      return reducer.reduceLiteralStringExpression(node);
    },
    reduceMethod: function reduceMethod(node, _ref48) {
      var name = _ref48.name,
          params = _ref48.params,
          body = _ref48.body;

      return reducer.reduceMethod(node, { name: name(), params: params(), body: body() });
    },
    reduceModule: function reduceModule(node, _ref49) {
      var directives = _ref49.directives,
          items = _ref49.items;

      return reducer.reduceModule(node, { directives: directives.map(function (n) {
          return n();
        }), items: items.map(function (n) {
          return n();
        }) });
    },
    reduceNewExpression: function reduceNewExpression(node, _ref50) {
      var callee = _ref50.callee,
          _arguments = _ref50.arguments;

      return reducer.reduceNewExpression(node, { callee: callee(), arguments: _arguments.map(function (n) {
          return n();
        }) });
    },
    reduceNewTargetExpression: function reduceNewTargetExpression(node) {
      return reducer.reduceNewTargetExpression(node);
    },
    reduceObjectAssignmentTarget: function reduceObjectAssignmentTarget(node, _ref51) {
      var properties = _ref51.properties,
          rest = _ref51.rest;

      return reducer.reduceObjectAssignmentTarget(node, { properties: properties.map(function (n) {
          return n();
        }), rest: rest == null ? null : rest() });
    },
    reduceObjectBinding: function reduceObjectBinding(node, _ref52) {
      var properties = _ref52.properties,
          rest = _ref52.rest;

      return reducer.reduceObjectBinding(node, { properties: properties.map(function (n) {
          return n();
        }), rest: rest == null ? null : rest() });
    },
    reduceObjectExpression: function reduceObjectExpression(node, _ref53) {
      var properties = _ref53.properties;

      return reducer.reduceObjectExpression(node, { properties: properties.map(function (n) {
          return n();
        }) });
    },
    reduceReturnStatement: function reduceReturnStatement(node, _ref54) {
      var expression = _ref54.expression;

      return reducer.reduceReturnStatement(node, { expression: expression == null ? null : expression() });
    },
    reduceScript: function reduceScript(node, _ref55) {
      var directives = _ref55.directives,
          statements = _ref55.statements;

      return reducer.reduceScript(node, { directives: directives.map(function (n) {
          return n();
        }), statements: statements.map(function (n) {
          return n();
        }) });
    },
    reduceSetter: function reduceSetter(node, _ref56) {
      var name = _ref56.name,
          param = _ref56.param,
          body = _ref56.body;

      return reducer.reduceSetter(node, { name: name(), param: param(), body: body() });
    },
    reduceShorthandProperty: function reduceShorthandProperty(node, _ref57) {
      var name = _ref57.name;

      return reducer.reduceShorthandProperty(node, { name: name() });
    },
    reduceSpreadElement: function reduceSpreadElement(node, _ref58) {
      var expression = _ref58.expression;

      return reducer.reduceSpreadElement(node, { expression: expression() });
    },
    reduceSpreadProperty: function reduceSpreadProperty(node, _ref59) {
      var expression = _ref59.expression;

      return reducer.reduceSpreadProperty(node, { expression: expression() });
    },
    reduceStaticMemberAssignmentTarget: function reduceStaticMemberAssignmentTarget(node, _ref60) {
      var object = _ref60.object;

      return reducer.reduceStaticMemberAssignmentTarget(node, { object: object() });
    },
    reduceStaticMemberExpression: function reduceStaticMemberExpression(node, _ref61) {
      var object = _ref61.object;

      return reducer.reduceStaticMemberExpression(node, { object: object() });
    },
    reduceStaticPropertyName: function reduceStaticPropertyName(node) {
      return reducer.reduceStaticPropertyName(node);
    },
    reduceSuper: function reduceSuper(node) {
      return reducer.reduceSuper(node);
    },
    reduceSwitchCase: function reduceSwitchCase(node, _ref62) {
      var test = _ref62.test,
          consequent = _ref62.consequent;

      return reducer.reduceSwitchCase(node, { test: test(), consequent: consequent.map(function (n) {
          return n();
        }) });
    },
    reduceSwitchDefault: function reduceSwitchDefault(node, _ref63) {
      var consequent = _ref63.consequent;

      return reducer.reduceSwitchDefault(node, { consequent: consequent.map(function (n) {
          return n();
        }) });
    },
    reduceSwitchStatement: function reduceSwitchStatement(node, _ref64) {
      var discriminant = _ref64.discriminant,
          cases = _ref64.cases;

      return reducer.reduceSwitchStatement(node, { discriminant: discriminant(), cases: cases.map(function (n) {
          return n();
        }) });
    },
    reduceSwitchStatementWithDefault: function reduceSwitchStatementWithDefault(node, _ref65) {
      var discriminant = _ref65.discriminant,
          preDefaultCases = _ref65.preDefaultCases,
          defaultCase = _ref65.defaultCase,
          postDefaultCases = _ref65.postDefaultCases;

      return reducer.reduceSwitchStatementWithDefault(node, { discriminant: discriminant(), preDefaultCases: preDefaultCases.map(function (n) {
          return n();
        }), defaultCase: defaultCase(), postDefaultCases: postDefaultCases.map(function (n) {
          return n();
        }) });
    },
    reduceTemplateElement: function reduceTemplateElement(node) {
      return reducer.reduceTemplateElement(node);
    },
    reduceTemplateExpression: function reduceTemplateExpression(node, _ref66) {
      var tag = _ref66.tag,
          elements = _ref66.elements;

      return reducer.reduceTemplateExpression(node, { tag: tag == null ? null : tag(), elements: elements.map(function (n) {
          return n();
        }) });
    },
    reduceThisExpression: function reduceThisExpression(node) {
      return reducer.reduceThisExpression(node);
    },
    reduceThrowStatement: function reduceThrowStatement(node, _ref67) {
      var expression = _ref67.expression;

      return reducer.reduceThrowStatement(node, { expression: expression() });
    },
    reduceTryCatchStatement: function reduceTryCatchStatement(node, _ref68) {
      var body = _ref68.body,
          catchClause = _ref68.catchClause;

      return reducer.reduceTryCatchStatement(node, { body: body(), catchClause: catchClause() });
    },
    reduceTryFinallyStatement: function reduceTryFinallyStatement(node, _ref69) {
      var body = _ref69.body,
          catchClause = _ref69.catchClause,
          finalizer = _ref69.finalizer;

      return reducer.reduceTryFinallyStatement(node, { body: body(), catchClause: catchClause == null ? null : catchClause(), finalizer: finalizer() });
    },
    reduceUnaryExpression: function reduceUnaryExpression(node, _ref70) {
      var operand = _ref70.operand;

      return reducer.reduceUnaryExpression(node, { operand: operand() });
    },
    reduceUpdateExpression: function reduceUpdateExpression(node, _ref71) {
      var operand = _ref71.operand;

      return reducer.reduceUpdateExpression(node, { operand: operand() });
    },
    reduceVariableDeclaration: function reduceVariableDeclaration(node, _ref72) {
      var declarators = _ref72.declarators;

      return reducer.reduceVariableDeclaration(node, { declarators: declarators.map(function (n) {
          return n();
        }) });
    },
    reduceVariableDeclarationStatement: function reduceVariableDeclarationStatement(node, _ref73) {
      var declaration = _ref73.declaration;

      return reducer.reduceVariableDeclarationStatement(node, { declaration: declaration() });
    },
    reduceVariableDeclarator: function reduceVariableDeclarator(node, _ref74) {
      var binding = _ref74.binding,
          init = _ref74.init;

      return reducer.reduceVariableDeclarator(node, { binding: binding(), init: init == null ? null : init() });
    },
    reduceWhileStatement: function reduceWhileStatement(node, _ref75) {
      var test = _ref75.test,
          body = _ref75.body;

      return reducer.reduceWhileStatement(node, { test: test(), body: body() });
    },
    reduceWithStatement: function reduceWithStatement(node, _ref76) {
      var object = _ref76.object,
          body = _ref76.body;

      return reducer.reduceWithStatement(node, { object: object(), body: body() });
    },
    reduceYieldExpression: function reduceYieldExpression(node, _ref77) {
      var expression = _ref77.expression;

      return reducer.reduceYieldExpression(node, { expression: expression == null ? null : expression() });
    },
    reduceYieldGeneratorExpression: function reduceYieldGeneratorExpression(node, _ref78) {
      var expression = _ref78.expression;

      return reducer.reduceYieldGeneratorExpression(node, { expression: expression() });
    }
  };
}
});

var thunkifyClass_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.default = thunkifyClass;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Generated by generate-thunkify.js
/**
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

function thunkifyClass(reducerClass) {
  return function (_reducerClass) {
    _inherits(_class, _reducerClass);

    function _class() {
      _classCallCheck(this, _class);

      return _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).apply(this, arguments));
    }

    _createClass(_class, [{
      key: "reduceArrayAssignmentTarget",
      value: function reduceArrayAssignmentTarget(node, _ref) {
        var elements = _ref.elements,
            rest = _ref.rest;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceArrayAssignmentTarget", this).call(this, node, { elements: elements.map(function (n) {
            return n == null ? null : n();
          }), rest: rest == null ? null : rest() });
      }
    }, {
      key: "reduceArrayBinding",
      value: function reduceArrayBinding(node, _ref2) {
        var elements = _ref2.elements,
            rest = _ref2.rest;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceArrayBinding", this).call(this, node, { elements: elements.map(function (n) {
            return n == null ? null : n();
          }), rest: rest == null ? null : rest() });
      }
    }, {
      key: "reduceArrayExpression",
      value: function reduceArrayExpression(node, _ref3) {
        var elements = _ref3.elements;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceArrayExpression", this).call(this, node, { elements: elements.map(function (n) {
            return n == null ? null : n();
          }) });
      }
    }, {
      key: "reduceArrowExpression",
      value: function reduceArrowExpression(node, _ref4) {
        var params = _ref4.params,
            body = _ref4.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceArrowExpression", this).call(this, node, { params: params(), body: body() });
      }
    }, {
      key: "reduceAssignmentExpression",
      value: function reduceAssignmentExpression(node, _ref5) {
        var binding = _ref5.binding,
            expression = _ref5.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceAssignmentExpression", this).call(this, node, { binding: binding(), expression: expression() });
      }
    }, {
      key: "reduceAssignmentTargetIdentifier",
      value: function reduceAssignmentTargetIdentifier(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceAssignmentTargetIdentifier", this).call(this, node);
      }
    }, {
      key: "reduceAssignmentTargetPropertyIdentifier",
      value: function reduceAssignmentTargetPropertyIdentifier(node, _ref6) {
        var binding = _ref6.binding,
            init = _ref6.init;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceAssignmentTargetPropertyIdentifier", this).call(this, node, { binding: binding(), init: init == null ? null : init() });
      }
    }, {
      key: "reduceAssignmentTargetPropertyProperty",
      value: function reduceAssignmentTargetPropertyProperty(node, _ref7) {
        var name = _ref7.name,
            binding = _ref7.binding;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceAssignmentTargetPropertyProperty", this).call(this, node, { name: name(), binding: binding() });
      }
    }, {
      key: "reduceAssignmentTargetWithDefault",
      value: function reduceAssignmentTargetWithDefault(node, _ref8) {
        var binding = _ref8.binding,
            init = _ref8.init;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceAssignmentTargetWithDefault", this).call(this, node, { binding: binding(), init: init() });
      }
    }, {
      key: "reduceAwaitExpression",
      value: function reduceAwaitExpression(node, _ref9) {
        var expression = _ref9.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceAwaitExpression", this).call(this, node, { expression: expression() });
      }
    }, {
      key: "reduceBinaryExpression",
      value: function reduceBinaryExpression(node, _ref10) {
        var left = _ref10.left,
            right = _ref10.right;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceBinaryExpression", this).call(this, node, { left: left(), right: right() });
      }
    }, {
      key: "reduceBindingIdentifier",
      value: function reduceBindingIdentifier(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceBindingIdentifier", this).call(this, node);
      }
    }, {
      key: "reduceBindingPropertyIdentifier",
      value: function reduceBindingPropertyIdentifier(node, _ref11) {
        var binding = _ref11.binding,
            init = _ref11.init;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceBindingPropertyIdentifier", this).call(this, node, { binding: binding(), init: init == null ? null : init() });
      }
    }, {
      key: "reduceBindingPropertyProperty",
      value: function reduceBindingPropertyProperty(node, _ref12) {
        var name = _ref12.name,
            binding = _ref12.binding;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceBindingPropertyProperty", this).call(this, node, { name: name(), binding: binding() });
      }
    }, {
      key: "reduceBindingWithDefault",
      value: function reduceBindingWithDefault(node, _ref13) {
        var binding = _ref13.binding,
            init = _ref13.init;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceBindingWithDefault", this).call(this, node, { binding: binding(), init: init() });
      }
    }, {
      key: "reduceBlock",
      value: function reduceBlock(node, _ref14) {
        var statements = _ref14.statements;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceBlock", this).call(this, node, { statements: statements.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceBlockStatement",
      value: function reduceBlockStatement(node, _ref15) {
        var block = _ref15.block;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceBlockStatement", this).call(this, node, { block: block() });
      }
    }, {
      key: "reduceBreakStatement",
      value: function reduceBreakStatement(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceBreakStatement", this).call(this, node);
      }
    }, {
      key: "reduceCallExpression",
      value: function reduceCallExpression(node, _ref16) {
        var callee = _ref16.callee,
            _arguments = _ref16.arguments;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceCallExpression", this).call(this, node, { callee: callee(), arguments: _arguments.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceCatchClause",
      value: function reduceCatchClause(node, _ref17) {
        var binding = _ref17.binding,
            body = _ref17.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceCatchClause", this).call(this, node, { binding: binding(), body: body() });
      }
    }, {
      key: "reduceClassDeclaration",
      value: function reduceClassDeclaration(node, _ref18) {
        var name = _ref18.name,
            _super = _ref18.super,
            elements = _ref18.elements;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceClassDeclaration", this).call(this, node, { name: name(), super: _super == null ? null : _super(), elements: elements.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceClassElement",
      value: function reduceClassElement(node, _ref19) {
        var method = _ref19.method;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceClassElement", this).call(this, node, { method: method() });
      }
    }, {
      key: "reduceClassExpression",
      value: function reduceClassExpression(node, _ref20) {
        var name = _ref20.name,
            _super = _ref20.super,
            elements = _ref20.elements;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceClassExpression", this).call(this, node, { name: name == null ? null : name(), super: _super == null ? null : _super(), elements: elements.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceCompoundAssignmentExpression",
      value: function reduceCompoundAssignmentExpression(node, _ref21) {
        var binding = _ref21.binding,
            expression = _ref21.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceCompoundAssignmentExpression", this).call(this, node, { binding: binding(), expression: expression() });
      }
    }, {
      key: "reduceComputedMemberAssignmentTarget",
      value: function reduceComputedMemberAssignmentTarget(node, _ref22) {
        var object = _ref22.object,
            expression = _ref22.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceComputedMemberAssignmentTarget", this).call(this, node, { object: object(), expression: expression() });
      }
    }, {
      key: "reduceComputedMemberExpression",
      value: function reduceComputedMemberExpression(node, _ref23) {
        var object = _ref23.object,
            expression = _ref23.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceComputedMemberExpression", this).call(this, node, { object: object(), expression: expression() });
      }
    }, {
      key: "reduceComputedPropertyName",
      value: function reduceComputedPropertyName(node, _ref24) {
        var expression = _ref24.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceComputedPropertyName", this).call(this, node, { expression: expression() });
      }
    }, {
      key: "reduceConditionalExpression",
      value: function reduceConditionalExpression(node, _ref25) {
        var test = _ref25.test,
            consequent = _ref25.consequent,
            alternate = _ref25.alternate;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceConditionalExpression", this).call(this, node, { test: test(), consequent: consequent(), alternate: alternate() });
      }
    }, {
      key: "reduceContinueStatement",
      value: function reduceContinueStatement(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceContinueStatement", this).call(this, node);
      }
    }, {
      key: "reduceDataProperty",
      value: function reduceDataProperty(node, _ref26) {
        var name = _ref26.name,
            expression = _ref26.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceDataProperty", this).call(this, node, { name: name(), expression: expression() });
      }
    }, {
      key: "reduceDebuggerStatement",
      value: function reduceDebuggerStatement(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceDebuggerStatement", this).call(this, node);
      }
    }, {
      key: "reduceDirective",
      value: function reduceDirective(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceDirective", this).call(this, node);
      }
    }, {
      key: "reduceDoWhileStatement",
      value: function reduceDoWhileStatement(node, _ref27) {
        var body = _ref27.body,
            test = _ref27.test;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceDoWhileStatement", this).call(this, node, { body: body(), test: test() });
      }
    }, {
      key: "reduceEmptyStatement",
      value: function reduceEmptyStatement(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceEmptyStatement", this).call(this, node);
      }
    }, {
      key: "reduceExport",
      value: function reduceExport(node, _ref28) {
        var declaration = _ref28.declaration;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceExport", this).call(this, node, { declaration: declaration() });
      }
    }, {
      key: "reduceExportAllFrom",
      value: function reduceExportAllFrom(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceExportAllFrom", this).call(this, node);
      }
    }, {
      key: "reduceExportDefault",
      value: function reduceExportDefault(node, _ref29) {
        var body = _ref29.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceExportDefault", this).call(this, node, { body: body() });
      }
    }, {
      key: "reduceExportFrom",
      value: function reduceExportFrom(node, _ref30) {
        var namedExports = _ref30.namedExports;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceExportFrom", this).call(this, node, { namedExports: namedExports.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceExportFromSpecifier",
      value: function reduceExportFromSpecifier(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceExportFromSpecifier", this).call(this, node);
      }
    }, {
      key: "reduceExportLocalSpecifier",
      value: function reduceExportLocalSpecifier(node, _ref31) {
        var name = _ref31.name;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceExportLocalSpecifier", this).call(this, node, { name: name() });
      }
    }, {
      key: "reduceExportLocals",
      value: function reduceExportLocals(node, _ref32) {
        var namedExports = _ref32.namedExports;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceExportLocals", this).call(this, node, { namedExports: namedExports.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceExpressionStatement",
      value: function reduceExpressionStatement(node, _ref33) {
        var expression = _ref33.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceExpressionStatement", this).call(this, node, { expression: expression() });
      }
    }, {
      key: "reduceForAwaitStatement",
      value: function reduceForAwaitStatement(node, _ref34) {
        var left = _ref34.left,
            right = _ref34.right,
            body = _ref34.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceForAwaitStatement", this).call(this, node, { left: left(), right: right(), body: body() });
      }
    }, {
      key: "reduceForInStatement",
      value: function reduceForInStatement(node, _ref35) {
        var left = _ref35.left,
            right = _ref35.right,
            body = _ref35.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceForInStatement", this).call(this, node, { left: left(), right: right(), body: body() });
      }
    }, {
      key: "reduceForOfStatement",
      value: function reduceForOfStatement(node, _ref36) {
        var left = _ref36.left,
            right = _ref36.right,
            body = _ref36.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceForOfStatement", this).call(this, node, { left: left(), right: right(), body: body() });
      }
    }, {
      key: "reduceForStatement",
      value: function reduceForStatement(node, _ref37) {
        var init = _ref37.init,
            test = _ref37.test,
            update = _ref37.update,
            body = _ref37.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceForStatement", this).call(this, node, { init: init == null ? null : init(), test: test == null ? null : test(), update: update == null ? null : update(), body: body() });
      }
    }, {
      key: "reduceFormalParameters",
      value: function reduceFormalParameters(node, _ref38) {
        var items = _ref38.items,
            rest = _ref38.rest;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceFormalParameters", this).call(this, node, { items: items.map(function (n) {
            return n();
          }), rest: rest == null ? null : rest() });
      }
    }, {
      key: "reduceFunctionBody",
      value: function reduceFunctionBody(node, _ref39) {
        var directives = _ref39.directives,
            statements = _ref39.statements;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceFunctionBody", this).call(this, node, { directives: directives.map(function (n) {
            return n();
          }), statements: statements.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceFunctionDeclaration",
      value: function reduceFunctionDeclaration(node, _ref40) {
        var name = _ref40.name,
            params = _ref40.params,
            body = _ref40.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceFunctionDeclaration", this).call(this, node, { name: name(), params: params(), body: body() });
      }
    }, {
      key: "reduceFunctionExpression",
      value: function reduceFunctionExpression(node, _ref41) {
        var name = _ref41.name,
            params = _ref41.params,
            body = _ref41.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceFunctionExpression", this).call(this, node, { name: name == null ? null : name(), params: params(), body: body() });
      }
    }, {
      key: "reduceGetter",
      value: function reduceGetter(node, _ref42) {
        var name = _ref42.name,
            body = _ref42.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceGetter", this).call(this, node, { name: name(), body: body() });
      }
    }, {
      key: "reduceIdentifierExpression",
      value: function reduceIdentifierExpression(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceIdentifierExpression", this).call(this, node);
      }
    }, {
      key: "reduceIfStatement",
      value: function reduceIfStatement(node, _ref43) {
        var test = _ref43.test,
            consequent = _ref43.consequent,
            alternate = _ref43.alternate;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceIfStatement", this).call(this, node, { test: test(), consequent: consequent(), alternate: alternate == null ? null : alternate() });
      }
    }, {
      key: "reduceImport",
      value: function reduceImport(node, _ref44) {
        var defaultBinding = _ref44.defaultBinding,
            namedImports = _ref44.namedImports;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceImport", this).call(this, node, { defaultBinding: defaultBinding == null ? null : defaultBinding(), namedImports: namedImports.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceImportNamespace",
      value: function reduceImportNamespace(node, _ref45) {
        var defaultBinding = _ref45.defaultBinding,
            namespaceBinding = _ref45.namespaceBinding;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceImportNamespace", this).call(this, node, { defaultBinding: defaultBinding == null ? null : defaultBinding(), namespaceBinding: namespaceBinding() });
      }
    }, {
      key: "reduceImportSpecifier",
      value: function reduceImportSpecifier(node, _ref46) {
        var binding = _ref46.binding;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceImportSpecifier", this).call(this, node, { binding: binding() });
      }
    }, {
      key: "reduceLabeledStatement",
      value: function reduceLabeledStatement(node, _ref47) {
        var body = _ref47.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceLabeledStatement", this).call(this, node, { body: body() });
      }
    }, {
      key: "reduceLiteralBooleanExpression",
      value: function reduceLiteralBooleanExpression(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceLiteralBooleanExpression", this).call(this, node);
      }
    }, {
      key: "reduceLiteralInfinityExpression",
      value: function reduceLiteralInfinityExpression(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceLiteralInfinityExpression", this).call(this, node);
      }
    }, {
      key: "reduceLiteralNullExpression",
      value: function reduceLiteralNullExpression(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceLiteralNullExpression", this).call(this, node);
      }
    }, {
      key: "reduceLiteralNumericExpression",
      value: function reduceLiteralNumericExpression(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceLiteralNumericExpression", this).call(this, node);
      }
    }, {
      key: "reduceLiteralRegExpExpression",
      value: function reduceLiteralRegExpExpression(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceLiteralRegExpExpression", this).call(this, node);
      }
    }, {
      key: "reduceLiteralStringExpression",
      value: function reduceLiteralStringExpression(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceLiteralStringExpression", this).call(this, node);
      }
    }, {
      key: "reduceMethod",
      value: function reduceMethod(node, _ref48) {
        var name = _ref48.name,
            params = _ref48.params,
            body = _ref48.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceMethod", this).call(this, node, { name: name(), params: params(), body: body() });
      }
    }, {
      key: "reduceModule",
      value: function reduceModule(node, _ref49) {
        var directives = _ref49.directives,
            items = _ref49.items;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceModule", this).call(this, node, { directives: directives.map(function (n) {
            return n();
          }), items: items.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceNewExpression",
      value: function reduceNewExpression(node, _ref50) {
        var callee = _ref50.callee,
            _arguments = _ref50.arguments;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceNewExpression", this).call(this, node, { callee: callee(), arguments: _arguments.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceNewTargetExpression",
      value: function reduceNewTargetExpression(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceNewTargetExpression", this).call(this, node);
      }
    }, {
      key: "reduceObjectAssignmentTarget",
      value: function reduceObjectAssignmentTarget(node, _ref51) {
        var properties = _ref51.properties,
            rest = _ref51.rest;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceObjectAssignmentTarget", this).call(this, node, { properties: properties.map(function (n) {
            return n();
          }), rest: rest == null ? null : rest() });
      }
    }, {
      key: "reduceObjectBinding",
      value: function reduceObjectBinding(node, _ref52) {
        var properties = _ref52.properties,
            rest = _ref52.rest;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceObjectBinding", this).call(this, node, { properties: properties.map(function (n) {
            return n();
          }), rest: rest == null ? null : rest() });
      }
    }, {
      key: "reduceObjectExpression",
      value: function reduceObjectExpression(node, _ref53) {
        var properties = _ref53.properties;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceObjectExpression", this).call(this, node, { properties: properties.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceReturnStatement",
      value: function reduceReturnStatement(node, _ref54) {
        var expression = _ref54.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceReturnStatement", this).call(this, node, { expression: expression == null ? null : expression() });
      }
    }, {
      key: "reduceScript",
      value: function reduceScript(node, _ref55) {
        var directives = _ref55.directives,
            statements = _ref55.statements;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceScript", this).call(this, node, { directives: directives.map(function (n) {
            return n();
          }), statements: statements.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceSetter",
      value: function reduceSetter(node, _ref56) {
        var name = _ref56.name,
            param = _ref56.param,
            body = _ref56.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceSetter", this).call(this, node, { name: name(), param: param(), body: body() });
      }
    }, {
      key: "reduceShorthandProperty",
      value: function reduceShorthandProperty(node, _ref57) {
        var name = _ref57.name;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceShorthandProperty", this).call(this, node, { name: name() });
      }
    }, {
      key: "reduceSpreadElement",
      value: function reduceSpreadElement(node, _ref58) {
        var expression = _ref58.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceSpreadElement", this).call(this, node, { expression: expression() });
      }
    }, {
      key: "reduceSpreadProperty",
      value: function reduceSpreadProperty(node, _ref59) {
        var expression = _ref59.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceSpreadProperty", this).call(this, node, { expression: expression() });
      }
    }, {
      key: "reduceStaticMemberAssignmentTarget",
      value: function reduceStaticMemberAssignmentTarget(node, _ref60) {
        var object = _ref60.object;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceStaticMemberAssignmentTarget", this).call(this, node, { object: object() });
      }
    }, {
      key: "reduceStaticMemberExpression",
      value: function reduceStaticMemberExpression(node, _ref61) {
        var object = _ref61.object;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceStaticMemberExpression", this).call(this, node, { object: object() });
      }
    }, {
      key: "reduceStaticPropertyName",
      value: function reduceStaticPropertyName(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceStaticPropertyName", this).call(this, node);
      }
    }, {
      key: "reduceSuper",
      value: function reduceSuper(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceSuper", this).call(this, node);
      }
    }, {
      key: "reduceSwitchCase",
      value: function reduceSwitchCase(node, _ref62) {
        var test = _ref62.test,
            consequent = _ref62.consequent;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceSwitchCase", this).call(this, node, { test: test(), consequent: consequent.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceSwitchDefault",
      value: function reduceSwitchDefault(node, _ref63) {
        var consequent = _ref63.consequent;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceSwitchDefault", this).call(this, node, { consequent: consequent.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceSwitchStatement",
      value: function reduceSwitchStatement(node, _ref64) {
        var discriminant = _ref64.discriminant,
            cases = _ref64.cases;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceSwitchStatement", this).call(this, node, { discriminant: discriminant(), cases: cases.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceSwitchStatementWithDefault",
      value: function reduceSwitchStatementWithDefault(node, _ref65) {
        var discriminant = _ref65.discriminant,
            preDefaultCases = _ref65.preDefaultCases,
            defaultCase = _ref65.defaultCase,
            postDefaultCases = _ref65.postDefaultCases;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceSwitchStatementWithDefault", this).call(this, node, { discriminant: discriminant(), preDefaultCases: preDefaultCases.map(function (n) {
            return n();
          }), defaultCase: defaultCase(), postDefaultCases: postDefaultCases.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceTemplateElement",
      value: function reduceTemplateElement(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceTemplateElement", this).call(this, node);
      }
    }, {
      key: "reduceTemplateExpression",
      value: function reduceTemplateExpression(node, _ref66) {
        var tag = _ref66.tag,
            elements = _ref66.elements;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceTemplateExpression", this).call(this, node, { tag: tag == null ? null : tag(), elements: elements.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceThisExpression",
      value: function reduceThisExpression(node) {
        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceThisExpression", this).call(this, node);
      }
    }, {
      key: "reduceThrowStatement",
      value: function reduceThrowStatement(node, _ref67) {
        var expression = _ref67.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceThrowStatement", this).call(this, node, { expression: expression() });
      }
    }, {
      key: "reduceTryCatchStatement",
      value: function reduceTryCatchStatement(node, _ref68) {
        var body = _ref68.body,
            catchClause = _ref68.catchClause;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceTryCatchStatement", this).call(this, node, { body: body(), catchClause: catchClause() });
      }
    }, {
      key: "reduceTryFinallyStatement",
      value: function reduceTryFinallyStatement(node, _ref69) {
        var body = _ref69.body,
            catchClause = _ref69.catchClause,
            finalizer = _ref69.finalizer;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceTryFinallyStatement", this).call(this, node, { body: body(), catchClause: catchClause == null ? null : catchClause(), finalizer: finalizer() });
      }
    }, {
      key: "reduceUnaryExpression",
      value: function reduceUnaryExpression(node, _ref70) {
        var operand = _ref70.operand;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceUnaryExpression", this).call(this, node, { operand: operand() });
      }
    }, {
      key: "reduceUpdateExpression",
      value: function reduceUpdateExpression(node, _ref71) {
        var operand = _ref71.operand;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceUpdateExpression", this).call(this, node, { operand: operand() });
      }
    }, {
      key: "reduceVariableDeclaration",
      value: function reduceVariableDeclaration(node, _ref72) {
        var declarators = _ref72.declarators;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceVariableDeclaration", this).call(this, node, { declarators: declarators.map(function (n) {
            return n();
          }) });
      }
    }, {
      key: "reduceVariableDeclarationStatement",
      value: function reduceVariableDeclarationStatement(node, _ref73) {
        var declaration = _ref73.declaration;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceVariableDeclarationStatement", this).call(this, node, { declaration: declaration() });
      }
    }, {
      key: "reduceVariableDeclarator",
      value: function reduceVariableDeclarator(node, _ref74) {
        var binding = _ref74.binding,
            init = _ref74.init;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceVariableDeclarator", this).call(this, node, { binding: binding(), init: init == null ? null : init() });
      }
    }, {
      key: "reduceWhileStatement",
      value: function reduceWhileStatement(node, _ref75) {
        var test = _ref75.test,
            body = _ref75.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceWhileStatement", this).call(this, node, { test: test(), body: body() });
      }
    }, {
      key: "reduceWithStatement",
      value: function reduceWithStatement(node, _ref76) {
        var object = _ref76.object,
            body = _ref76.body;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceWithStatement", this).call(this, node, { object: object(), body: body() });
      }
    }, {
      key: "reduceYieldExpression",
      value: function reduceYieldExpression(node, _ref77) {
        var expression = _ref77.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceYieldExpression", this).call(this, node, { expression: expression == null ? null : expression() });
      }
    }, {
      key: "reduceYieldGeneratorExpression",
      value: function reduceYieldGeneratorExpression(node, _ref78) {
        var expression = _ref78.expression;

        return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "reduceYieldGeneratorExpression", this).call(this, node, { expression: expression() });
      }
    }]);

    return _class;
  }(reducerClass);
}
});

var memoize_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = memoize;



var Shift = _interopRequireWildcard(dist$2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function memoize(reducer) {
  var cache = new WeakMap();
  return {
    reduceArrayAssignmentTarget: function reduceArrayAssignmentTarget(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceArrayAssignmentTarget(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceArrayBinding: function reduceArrayBinding(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceArrayBinding(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceArrayExpression: function reduceArrayExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceArrayExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceArrowExpression: function reduceArrowExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceArrowExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceAssignmentExpression: function reduceAssignmentExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceAssignmentExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceAssignmentTargetIdentifier: function reduceAssignmentTargetIdentifier(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceAssignmentTargetIdentifier(node);
      cache.set(node, res);
      return res;
    },
    reduceAssignmentTargetPropertyIdentifier: function reduceAssignmentTargetPropertyIdentifier(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceAssignmentTargetPropertyIdentifier(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceAssignmentTargetPropertyProperty: function reduceAssignmentTargetPropertyProperty(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceAssignmentTargetPropertyProperty(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceAssignmentTargetWithDefault: function reduceAssignmentTargetWithDefault(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceAssignmentTargetWithDefault(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceAwaitExpression: function reduceAwaitExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceAwaitExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceBinaryExpression: function reduceBinaryExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceBinaryExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceBindingIdentifier: function reduceBindingIdentifier(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceBindingIdentifier(node);
      cache.set(node, res);
      return res;
    },
    reduceBindingPropertyIdentifier: function reduceBindingPropertyIdentifier(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceBindingPropertyIdentifier(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceBindingPropertyProperty: function reduceBindingPropertyProperty(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceBindingPropertyProperty(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceBindingWithDefault: function reduceBindingWithDefault(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceBindingWithDefault(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceBlock: function reduceBlock(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceBlock(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceBlockStatement: function reduceBlockStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceBlockStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceBreakStatement: function reduceBreakStatement(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceBreakStatement(node);
      cache.set(node, res);
      return res;
    },
    reduceCallExpression: function reduceCallExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceCallExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceCatchClause: function reduceCatchClause(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceCatchClause(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceClassDeclaration: function reduceClassDeclaration(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceClassDeclaration(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceClassElement: function reduceClassElement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceClassElement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceClassExpression: function reduceClassExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceClassExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceCompoundAssignmentExpression: function reduceCompoundAssignmentExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceCompoundAssignmentExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceComputedMemberAssignmentTarget: function reduceComputedMemberAssignmentTarget(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceComputedMemberAssignmentTarget(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceComputedMemberExpression: function reduceComputedMemberExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceComputedMemberExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceComputedPropertyName: function reduceComputedPropertyName(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceComputedPropertyName(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceConditionalExpression: function reduceConditionalExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceConditionalExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceContinueStatement: function reduceContinueStatement(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceContinueStatement(node);
      cache.set(node, res);
      return res;
    },
    reduceDataProperty: function reduceDataProperty(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceDataProperty(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceDebuggerStatement: function reduceDebuggerStatement(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceDebuggerStatement(node);
      cache.set(node, res);
      return res;
    },
    reduceDirective: function reduceDirective(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceDirective(node);
      cache.set(node, res);
      return res;
    },
    reduceDoWhileStatement: function reduceDoWhileStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceDoWhileStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceEmptyStatement: function reduceEmptyStatement(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceEmptyStatement(node);
      cache.set(node, res);
      return res;
    },
    reduceExport: function reduceExport(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceExport(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceExportAllFrom: function reduceExportAllFrom(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceExportAllFrom(node);
      cache.set(node, res);
      return res;
    },
    reduceExportDefault: function reduceExportDefault(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceExportDefault(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceExportFrom: function reduceExportFrom(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceExportFrom(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceExportFromSpecifier: function reduceExportFromSpecifier(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceExportFromSpecifier(node);
      cache.set(node, res);
      return res;
    },
    reduceExportLocalSpecifier: function reduceExportLocalSpecifier(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceExportLocalSpecifier(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceExportLocals: function reduceExportLocals(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceExportLocals(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceExpressionStatement: function reduceExpressionStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceExpressionStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceForAwaitStatement: function reduceForAwaitStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceForAwaitStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceForInStatement: function reduceForInStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceForInStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceForOfStatement: function reduceForOfStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceForOfStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceForStatement: function reduceForStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceForStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceFormalParameters: function reduceFormalParameters(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceFormalParameters(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceFunctionBody: function reduceFunctionBody(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceFunctionBody(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceFunctionDeclaration: function reduceFunctionDeclaration(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceFunctionDeclaration(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceFunctionExpression: function reduceFunctionExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceFunctionExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceGetter: function reduceGetter(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceGetter(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceIdentifierExpression: function reduceIdentifierExpression(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceIdentifierExpression(node);
      cache.set(node, res);
      return res;
    },
    reduceIfStatement: function reduceIfStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceIfStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceImport: function reduceImport(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceImport(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceImportNamespace: function reduceImportNamespace(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceImportNamespace(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceImportSpecifier: function reduceImportSpecifier(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceImportSpecifier(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceLabeledStatement: function reduceLabeledStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceLabeledStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceLiteralBooleanExpression: function reduceLiteralBooleanExpression(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceLiteralBooleanExpression(node);
      cache.set(node, res);
      return res;
    },
    reduceLiteralInfinityExpression: function reduceLiteralInfinityExpression(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceLiteralInfinityExpression(node);
      cache.set(node, res);
      return res;
    },
    reduceLiteralNullExpression: function reduceLiteralNullExpression(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceLiteralNullExpression(node);
      cache.set(node, res);
      return res;
    },
    reduceLiteralNumericExpression: function reduceLiteralNumericExpression(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceLiteralNumericExpression(node);
      cache.set(node, res);
      return res;
    },
    reduceLiteralRegExpExpression: function reduceLiteralRegExpExpression(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceLiteralRegExpExpression(node);
      cache.set(node, res);
      return res;
    },
    reduceLiteralStringExpression: function reduceLiteralStringExpression(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceLiteralStringExpression(node);
      cache.set(node, res);
      return res;
    },
    reduceMethod: function reduceMethod(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceMethod(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceModule: function reduceModule(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceModule(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceNewExpression: function reduceNewExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceNewExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceNewTargetExpression: function reduceNewTargetExpression(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceNewTargetExpression(node);
      cache.set(node, res);
      return res;
    },
    reduceObjectAssignmentTarget: function reduceObjectAssignmentTarget(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceObjectAssignmentTarget(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceObjectBinding: function reduceObjectBinding(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceObjectBinding(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceObjectExpression: function reduceObjectExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceObjectExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceReturnStatement: function reduceReturnStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceReturnStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceScript: function reduceScript(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceScript(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceSetter: function reduceSetter(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceSetter(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceShorthandProperty: function reduceShorthandProperty(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceShorthandProperty(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceSpreadElement: function reduceSpreadElement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceSpreadElement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceSpreadProperty: function reduceSpreadProperty(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceSpreadProperty(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceStaticMemberAssignmentTarget: function reduceStaticMemberAssignmentTarget(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceStaticMemberAssignmentTarget(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceStaticMemberExpression: function reduceStaticMemberExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceStaticMemberExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceStaticPropertyName: function reduceStaticPropertyName(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceStaticPropertyName(node);
      cache.set(node, res);
      return res;
    },
    reduceSuper: function reduceSuper(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceSuper(node);
      cache.set(node, res);
      return res;
    },
    reduceSwitchCase: function reduceSwitchCase(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceSwitchCase(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceSwitchDefault: function reduceSwitchDefault(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceSwitchDefault(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceSwitchStatement: function reduceSwitchStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceSwitchStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceSwitchStatementWithDefault: function reduceSwitchStatementWithDefault(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceSwitchStatementWithDefault(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceTemplateElement: function reduceTemplateElement(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceTemplateElement(node);
      cache.set(node, res);
      return res;
    },
    reduceTemplateExpression: function reduceTemplateExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceTemplateExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceThisExpression: function reduceThisExpression(node) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceThisExpression(node);
      cache.set(node, res);
      return res;
    },
    reduceThrowStatement: function reduceThrowStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceThrowStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceTryCatchStatement: function reduceTryCatchStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceTryCatchStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceTryFinallyStatement: function reduceTryFinallyStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceTryFinallyStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceUnaryExpression: function reduceUnaryExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceUnaryExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceUpdateExpression: function reduceUpdateExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceUpdateExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceVariableDeclaration: function reduceVariableDeclaration(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceVariableDeclaration(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceVariableDeclarationStatement: function reduceVariableDeclarationStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceVariableDeclarationStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceVariableDeclarator: function reduceVariableDeclarator(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceVariableDeclarator(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceWhileStatement: function reduceWhileStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceWhileStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceWithStatement: function reduceWithStatement(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceWithStatement(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceYieldExpression: function reduceYieldExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceYieldExpression(node, arg);
      cache.set(node, res);
      return res;
    },
    reduceYieldGeneratorExpression: function reduceYieldGeneratorExpression(node, arg) {
      if (cache.has(node)) {
        return cache.get(node);
      }
      var res = reducer.reduceYieldGeneratorExpression(node, arg);
      cache.set(node, res);
      return res;
    }
  };
} // Generated by generate-memoize.js
/**
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
});

var cloneReducer = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Generated by generate-clone-reducer.js
/**
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



var Shift = _interopRequireWildcard(dist$2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CloneReducer = function () {
  function CloneReducer() {
    _classCallCheck(this, CloneReducer);
  }

  _createClass(CloneReducer, [{
    key: 'reduceArrayAssignmentTarget',
    value: function reduceArrayAssignmentTarget(node, _ref) {
      var elements = _ref.elements,
          rest = _ref.rest;

      return new Shift.ArrayAssignmentTarget({ elements: elements, rest: rest });
    }
  }, {
    key: 'reduceArrayBinding',
    value: function reduceArrayBinding(node, _ref2) {
      var elements = _ref2.elements,
          rest = _ref2.rest;

      return new Shift.ArrayBinding({ elements: elements, rest: rest });
    }
  }, {
    key: 'reduceArrayExpression',
    value: function reduceArrayExpression(node, _ref3) {
      var elements = _ref3.elements;

      return new Shift.ArrayExpression({ elements: elements });
    }
  }, {
    key: 'reduceArrowExpression',
    value: function reduceArrowExpression(node, _ref4) {
      var params = _ref4.params,
          body = _ref4.body;

      return new Shift.ArrowExpression({ isAsync: node.isAsync, params: params, body: body });
    }
  }, {
    key: 'reduceAssignmentExpression',
    value: function reduceAssignmentExpression(node, _ref5) {
      var binding = _ref5.binding,
          expression = _ref5.expression;

      return new Shift.AssignmentExpression({ binding: binding, expression: expression });
    }
  }, {
    key: 'reduceAssignmentTargetIdentifier',
    value: function reduceAssignmentTargetIdentifier(node) {
      return new Shift.AssignmentTargetIdentifier({ name: node.name });
    }
  }, {
    key: 'reduceAssignmentTargetPropertyIdentifier',
    value: function reduceAssignmentTargetPropertyIdentifier(node, _ref6) {
      var binding = _ref6.binding,
          init = _ref6.init;

      return new Shift.AssignmentTargetPropertyIdentifier({ binding: binding, init: init });
    }
  }, {
    key: 'reduceAssignmentTargetPropertyProperty',
    value: function reduceAssignmentTargetPropertyProperty(node, _ref7) {
      var name = _ref7.name,
          binding = _ref7.binding;

      return new Shift.AssignmentTargetPropertyProperty({ name: name, binding: binding });
    }
  }, {
    key: 'reduceAssignmentTargetWithDefault',
    value: function reduceAssignmentTargetWithDefault(node, _ref8) {
      var binding = _ref8.binding,
          init = _ref8.init;

      return new Shift.AssignmentTargetWithDefault({ binding: binding, init: init });
    }
  }, {
    key: 'reduceAwaitExpression',
    value: function reduceAwaitExpression(node, _ref9) {
      var expression = _ref9.expression;

      return new Shift.AwaitExpression({ expression: expression });
    }
  }, {
    key: 'reduceBinaryExpression',
    value: function reduceBinaryExpression(node, _ref10) {
      var left = _ref10.left,
          right = _ref10.right;

      return new Shift.BinaryExpression({ left: left, operator: node.operator, right: right });
    }
  }, {
    key: 'reduceBindingIdentifier',
    value: function reduceBindingIdentifier(node) {
      return new Shift.BindingIdentifier({ name: node.name });
    }
  }, {
    key: 'reduceBindingPropertyIdentifier',
    value: function reduceBindingPropertyIdentifier(node, _ref11) {
      var binding = _ref11.binding,
          init = _ref11.init;

      return new Shift.BindingPropertyIdentifier({ binding: binding, init: init });
    }
  }, {
    key: 'reduceBindingPropertyProperty',
    value: function reduceBindingPropertyProperty(node, _ref12) {
      var name = _ref12.name,
          binding = _ref12.binding;

      return new Shift.BindingPropertyProperty({ name: name, binding: binding });
    }
  }, {
    key: 'reduceBindingWithDefault',
    value: function reduceBindingWithDefault(node, _ref13) {
      var binding = _ref13.binding,
          init = _ref13.init;

      return new Shift.BindingWithDefault({ binding: binding, init: init });
    }
  }, {
    key: 'reduceBlock',
    value: function reduceBlock(node, _ref14) {
      var statements = _ref14.statements;

      return new Shift.Block({ statements: statements });
    }
  }, {
    key: 'reduceBlockStatement',
    value: function reduceBlockStatement(node, _ref15) {
      var block = _ref15.block;

      return new Shift.BlockStatement({ block: block });
    }
  }, {
    key: 'reduceBreakStatement',
    value: function reduceBreakStatement(node) {
      return new Shift.BreakStatement({ label: node.label });
    }
  }, {
    key: 'reduceCallExpression',
    value: function reduceCallExpression(node, _ref16) {
      var callee = _ref16.callee,
          _arguments = _ref16.arguments;

      return new Shift.CallExpression({ callee: callee, arguments: _arguments });
    }
  }, {
    key: 'reduceCatchClause',
    value: function reduceCatchClause(node, _ref17) {
      var binding = _ref17.binding,
          body = _ref17.body;

      return new Shift.CatchClause({ binding: binding, body: body });
    }
  }, {
    key: 'reduceClassDeclaration',
    value: function reduceClassDeclaration(node, _ref18) {
      var name = _ref18.name,
          _super = _ref18.super,
          elements = _ref18.elements;

      return new Shift.ClassDeclaration({ name: name, super: _super, elements: elements });
    }
  }, {
    key: 'reduceClassElement',
    value: function reduceClassElement(node, _ref19) {
      var method = _ref19.method;

      return new Shift.ClassElement({ isStatic: node.isStatic, method: method });
    }
  }, {
    key: 'reduceClassExpression',
    value: function reduceClassExpression(node, _ref20) {
      var name = _ref20.name,
          _super = _ref20.super,
          elements = _ref20.elements;

      return new Shift.ClassExpression({ name: name, super: _super, elements: elements });
    }
  }, {
    key: 'reduceCompoundAssignmentExpression',
    value: function reduceCompoundAssignmentExpression(node, _ref21) {
      var binding = _ref21.binding,
          expression = _ref21.expression;

      return new Shift.CompoundAssignmentExpression({ binding: binding, operator: node.operator, expression: expression });
    }
  }, {
    key: 'reduceComputedMemberAssignmentTarget',
    value: function reduceComputedMemberAssignmentTarget(node, _ref22) {
      var object = _ref22.object,
          expression = _ref22.expression;

      return new Shift.ComputedMemberAssignmentTarget({ object: object, expression: expression });
    }
  }, {
    key: 'reduceComputedMemberExpression',
    value: function reduceComputedMemberExpression(node, _ref23) {
      var object = _ref23.object,
          expression = _ref23.expression;

      return new Shift.ComputedMemberExpression({ object: object, expression: expression });
    }
  }, {
    key: 'reduceComputedPropertyName',
    value: function reduceComputedPropertyName(node, _ref24) {
      var expression = _ref24.expression;

      return new Shift.ComputedPropertyName({ expression: expression });
    }
  }, {
    key: 'reduceConditionalExpression',
    value: function reduceConditionalExpression(node, _ref25) {
      var test = _ref25.test,
          consequent = _ref25.consequent,
          alternate = _ref25.alternate;

      return new Shift.ConditionalExpression({ test: test, consequent: consequent, alternate: alternate });
    }
  }, {
    key: 'reduceContinueStatement',
    value: function reduceContinueStatement(node) {
      return new Shift.ContinueStatement({ label: node.label });
    }
  }, {
    key: 'reduceDataProperty',
    value: function reduceDataProperty(node, _ref26) {
      var name = _ref26.name,
          expression = _ref26.expression;

      return new Shift.DataProperty({ name: name, expression: expression });
    }
  }, {
    key: 'reduceDebuggerStatement',
    value: function reduceDebuggerStatement(node) {
      return new Shift.DebuggerStatement();
    }
  }, {
    key: 'reduceDirective',
    value: function reduceDirective(node) {
      return new Shift.Directive({ rawValue: node.rawValue });
    }
  }, {
    key: 'reduceDoWhileStatement',
    value: function reduceDoWhileStatement(node, _ref27) {
      var body = _ref27.body,
          test = _ref27.test;

      return new Shift.DoWhileStatement({ body: body, test: test });
    }
  }, {
    key: 'reduceEmptyStatement',
    value: function reduceEmptyStatement(node) {
      return new Shift.EmptyStatement();
    }
  }, {
    key: 'reduceExport',
    value: function reduceExport(node, _ref28) {
      var declaration = _ref28.declaration;

      return new Shift.Export({ declaration: declaration });
    }
  }, {
    key: 'reduceExportAllFrom',
    value: function reduceExportAllFrom(node) {
      return new Shift.ExportAllFrom({ moduleSpecifier: node.moduleSpecifier });
    }
  }, {
    key: 'reduceExportDefault',
    value: function reduceExportDefault(node, _ref29) {
      var body = _ref29.body;

      return new Shift.ExportDefault({ body: body });
    }
  }, {
    key: 'reduceExportFrom',
    value: function reduceExportFrom(node, _ref30) {
      var namedExports = _ref30.namedExports;

      return new Shift.ExportFrom({ namedExports: namedExports, moduleSpecifier: node.moduleSpecifier });
    }
  }, {
    key: 'reduceExportFromSpecifier',
    value: function reduceExportFromSpecifier(node) {
      return new Shift.ExportFromSpecifier({ name: node.name, exportedName: node.exportedName });
    }
  }, {
    key: 'reduceExportLocalSpecifier',
    value: function reduceExportLocalSpecifier(node, _ref31) {
      var name = _ref31.name;

      return new Shift.ExportLocalSpecifier({ name: name, exportedName: node.exportedName });
    }
  }, {
    key: 'reduceExportLocals',
    value: function reduceExportLocals(node, _ref32) {
      var namedExports = _ref32.namedExports;

      return new Shift.ExportLocals({ namedExports: namedExports });
    }
  }, {
    key: 'reduceExpressionStatement',
    value: function reduceExpressionStatement(node, _ref33) {
      var expression = _ref33.expression;

      return new Shift.ExpressionStatement({ expression: expression });
    }
  }, {
    key: 'reduceForAwaitStatement',
    value: function reduceForAwaitStatement(node, _ref34) {
      var left = _ref34.left,
          right = _ref34.right,
          body = _ref34.body;

      return new Shift.ForAwaitStatement({ left: left, right: right, body: body });
    }
  }, {
    key: 'reduceForInStatement',
    value: function reduceForInStatement(node, _ref35) {
      var left = _ref35.left,
          right = _ref35.right,
          body = _ref35.body;

      return new Shift.ForInStatement({ left: left, right: right, body: body });
    }
  }, {
    key: 'reduceForOfStatement',
    value: function reduceForOfStatement(node, _ref36) {
      var left = _ref36.left,
          right = _ref36.right,
          body = _ref36.body;

      return new Shift.ForOfStatement({ left: left, right: right, body: body });
    }
  }, {
    key: 'reduceForStatement',
    value: function reduceForStatement(node, _ref37) {
      var init = _ref37.init,
          test = _ref37.test,
          update = _ref37.update,
          body = _ref37.body;

      return new Shift.ForStatement({ init: init, test: test, update: update, body: body });
    }
  }, {
    key: 'reduceFormalParameters',
    value: function reduceFormalParameters(node, _ref38) {
      var items = _ref38.items,
          rest = _ref38.rest;

      return new Shift.FormalParameters({ items: items, rest: rest });
    }
  }, {
    key: 'reduceFunctionBody',
    value: function reduceFunctionBody(node, _ref39) {
      var directives = _ref39.directives,
          statements = _ref39.statements;

      return new Shift.FunctionBody({ directives: directives, statements: statements });
    }
  }, {
    key: 'reduceFunctionDeclaration',
    value: function reduceFunctionDeclaration(node, _ref40) {
      var name = _ref40.name,
          params = _ref40.params,
          body = _ref40.body;

      return new Shift.FunctionDeclaration({ isAsync: node.isAsync, isGenerator: node.isGenerator, name: name, params: params, body: body });
    }
  }, {
    key: 'reduceFunctionExpression',
    value: function reduceFunctionExpression(node, _ref41) {
      var name = _ref41.name,
          params = _ref41.params,
          body = _ref41.body;

      return new Shift.FunctionExpression({ isAsync: node.isAsync, isGenerator: node.isGenerator, name: name, params: params, body: body });
    }
  }, {
    key: 'reduceGetter',
    value: function reduceGetter(node, _ref42) {
      var name = _ref42.name,
          body = _ref42.body;

      return new Shift.Getter({ name: name, body: body });
    }
  }, {
    key: 'reduceIdentifierExpression',
    value: function reduceIdentifierExpression(node) {
      return new Shift.IdentifierExpression({ name: node.name });
    }
  }, {
    key: 'reduceIfStatement',
    value: function reduceIfStatement(node, _ref43) {
      var test = _ref43.test,
          consequent = _ref43.consequent,
          alternate = _ref43.alternate;

      return new Shift.IfStatement({ test: test, consequent: consequent, alternate: alternate });
    }
  }, {
    key: 'reduceImport',
    value: function reduceImport(node, _ref44) {
      var defaultBinding = _ref44.defaultBinding,
          namedImports = _ref44.namedImports;

      return new Shift.Import({ defaultBinding: defaultBinding, namedImports: namedImports, moduleSpecifier: node.moduleSpecifier });
    }
  }, {
    key: 'reduceImportNamespace',
    value: function reduceImportNamespace(node, _ref45) {
      var defaultBinding = _ref45.defaultBinding,
          namespaceBinding = _ref45.namespaceBinding;

      return new Shift.ImportNamespace({ defaultBinding: defaultBinding, namespaceBinding: namespaceBinding, moduleSpecifier: node.moduleSpecifier });
    }
  }, {
    key: 'reduceImportSpecifier',
    value: function reduceImportSpecifier(node, _ref46) {
      var binding = _ref46.binding;

      return new Shift.ImportSpecifier({ name: node.name, binding: binding });
    }
  }, {
    key: 'reduceLabeledStatement',
    value: function reduceLabeledStatement(node, _ref47) {
      var body = _ref47.body;

      return new Shift.LabeledStatement({ label: node.label, body: body });
    }
  }, {
    key: 'reduceLiteralBooleanExpression',
    value: function reduceLiteralBooleanExpression(node) {
      return new Shift.LiteralBooleanExpression({ value: node.value });
    }
  }, {
    key: 'reduceLiteralInfinityExpression',
    value: function reduceLiteralInfinityExpression(node) {
      return new Shift.LiteralInfinityExpression();
    }
  }, {
    key: 'reduceLiteralNullExpression',
    value: function reduceLiteralNullExpression(node) {
      return new Shift.LiteralNullExpression();
    }
  }, {
    key: 'reduceLiteralNumericExpression',
    value: function reduceLiteralNumericExpression(node) {
      return new Shift.LiteralNumericExpression({ value: node.value });
    }
  }, {
    key: 'reduceLiteralRegExpExpression',
    value: function reduceLiteralRegExpExpression(node) {
      return new Shift.LiteralRegExpExpression({ pattern: node.pattern, global: node.global, ignoreCase: node.ignoreCase, multiLine: node.multiLine, dotAll: node.dotAll, unicode: node.unicode, sticky: node.sticky });
    }
  }, {
    key: 'reduceLiteralStringExpression',
    value: function reduceLiteralStringExpression(node) {
      return new Shift.LiteralStringExpression({ value: node.value });
    }
  }, {
    key: 'reduceMethod',
    value: function reduceMethod(node, _ref48) {
      var name = _ref48.name,
          params = _ref48.params,
          body = _ref48.body;

      return new Shift.Method({ isAsync: node.isAsync, isGenerator: node.isGenerator, name: name, params: params, body: body });
    }
  }, {
    key: 'reduceModule',
    value: function reduceModule(node, _ref49) {
      var directives = _ref49.directives,
          items = _ref49.items;

      return new Shift.Module({ directives: directives, items: items });
    }
  }, {
    key: 'reduceNewExpression',
    value: function reduceNewExpression(node, _ref50) {
      var callee = _ref50.callee,
          _arguments = _ref50.arguments;

      return new Shift.NewExpression({ callee: callee, arguments: _arguments });
    }
  }, {
    key: 'reduceNewTargetExpression',
    value: function reduceNewTargetExpression(node) {
      return new Shift.NewTargetExpression();
    }
  }, {
    key: 'reduceObjectAssignmentTarget',
    value: function reduceObjectAssignmentTarget(node, _ref51) {
      var properties = _ref51.properties,
          rest = _ref51.rest;

      return new Shift.ObjectAssignmentTarget({ properties: properties, rest: rest });
    }
  }, {
    key: 'reduceObjectBinding',
    value: function reduceObjectBinding(node, _ref52) {
      var properties = _ref52.properties,
          rest = _ref52.rest;

      return new Shift.ObjectBinding({ properties: properties, rest: rest });
    }
  }, {
    key: 'reduceObjectExpression',
    value: function reduceObjectExpression(node, _ref53) {
      var properties = _ref53.properties;

      return new Shift.ObjectExpression({ properties: properties });
    }
  }, {
    key: 'reduceReturnStatement',
    value: function reduceReturnStatement(node, _ref54) {
      var expression = _ref54.expression;

      return new Shift.ReturnStatement({ expression: expression });
    }
  }, {
    key: 'reduceScript',
    value: function reduceScript(node, _ref55) {
      var directives = _ref55.directives,
          statements = _ref55.statements;

      return new Shift.Script({ directives: directives, statements: statements });
    }
  }, {
    key: 'reduceSetter',
    value: function reduceSetter(node, _ref56) {
      var name = _ref56.name,
          param = _ref56.param,
          body = _ref56.body;

      return new Shift.Setter({ name: name, param: param, body: body });
    }
  }, {
    key: 'reduceShorthandProperty',
    value: function reduceShorthandProperty(node, _ref57) {
      var name = _ref57.name;

      return new Shift.ShorthandProperty({ name: name });
    }
  }, {
    key: 'reduceSpreadElement',
    value: function reduceSpreadElement(node, _ref58) {
      var expression = _ref58.expression;

      return new Shift.SpreadElement({ expression: expression });
    }
  }, {
    key: 'reduceSpreadProperty',
    value: function reduceSpreadProperty(node, _ref59) {
      var expression = _ref59.expression;

      return new Shift.SpreadProperty({ expression: expression });
    }
  }, {
    key: 'reduceStaticMemberAssignmentTarget',
    value: function reduceStaticMemberAssignmentTarget(node, _ref60) {
      var object = _ref60.object;

      return new Shift.StaticMemberAssignmentTarget({ object: object, property: node.property });
    }
  }, {
    key: 'reduceStaticMemberExpression',
    value: function reduceStaticMemberExpression(node, _ref61) {
      var object = _ref61.object;

      return new Shift.StaticMemberExpression({ object: object, property: node.property });
    }
  }, {
    key: 'reduceStaticPropertyName',
    value: function reduceStaticPropertyName(node) {
      return new Shift.StaticPropertyName({ value: node.value });
    }
  }, {
    key: 'reduceSuper',
    value: function reduceSuper(node) {
      return new Shift.Super();
    }
  }, {
    key: 'reduceSwitchCase',
    value: function reduceSwitchCase(node, _ref62) {
      var test = _ref62.test,
          consequent = _ref62.consequent;

      return new Shift.SwitchCase({ test: test, consequent: consequent });
    }
  }, {
    key: 'reduceSwitchDefault',
    value: function reduceSwitchDefault(node, _ref63) {
      var consequent = _ref63.consequent;

      return new Shift.SwitchDefault({ consequent: consequent });
    }
  }, {
    key: 'reduceSwitchStatement',
    value: function reduceSwitchStatement(node, _ref64) {
      var discriminant = _ref64.discriminant,
          cases = _ref64.cases;

      return new Shift.SwitchStatement({ discriminant: discriminant, cases: cases });
    }
  }, {
    key: 'reduceSwitchStatementWithDefault',
    value: function reduceSwitchStatementWithDefault(node, _ref65) {
      var discriminant = _ref65.discriminant,
          preDefaultCases = _ref65.preDefaultCases,
          defaultCase = _ref65.defaultCase,
          postDefaultCases = _ref65.postDefaultCases;

      return new Shift.SwitchStatementWithDefault({ discriminant: discriminant, preDefaultCases: preDefaultCases, defaultCase: defaultCase, postDefaultCases: postDefaultCases });
    }
  }, {
    key: 'reduceTemplateElement',
    value: function reduceTemplateElement(node) {
      return new Shift.TemplateElement({ rawValue: node.rawValue });
    }
  }, {
    key: 'reduceTemplateExpression',
    value: function reduceTemplateExpression(node, _ref66) {
      var tag = _ref66.tag,
          elements = _ref66.elements;

      return new Shift.TemplateExpression({ tag: tag, elements: elements });
    }
  }, {
    key: 'reduceThisExpression',
    value: function reduceThisExpression(node) {
      return new Shift.ThisExpression();
    }
  }, {
    key: 'reduceThrowStatement',
    value: function reduceThrowStatement(node, _ref67) {
      var expression = _ref67.expression;

      return new Shift.ThrowStatement({ expression: expression });
    }
  }, {
    key: 'reduceTryCatchStatement',
    value: function reduceTryCatchStatement(node, _ref68) {
      var body = _ref68.body,
          catchClause = _ref68.catchClause;

      return new Shift.TryCatchStatement({ body: body, catchClause: catchClause });
    }
  }, {
    key: 'reduceTryFinallyStatement',
    value: function reduceTryFinallyStatement(node, _ref69) {
      var body = _ref69.body,
          catchClause = _ref69.catchClause,
          finalizer = _ref69.finalizer;

      return new Shift.TryFinallyStatement({ body: body, catchClause: catchClause, finalizer: finalizer });
    }
  }, {
    key: 'reduceUnaryExpression',
    value: function reduceUnaryExpression(node, _ref70) {
      var operand = _ref70.operand;

      return new Shift.UnaryExpression({ operator: node.operator, operand: operand });
    }
  }, {
    key: 'reduceUpdateExpression',
    value: function reduceUpdateExpression(node, _ref71) {
      var operand = _ref71.operand;

      return new Shift.UpdateExpression({ isPrefix: node.isPrefix, operator: node.operator, operand: operand });
    }
  }, {
    key: 'reduceVariableDeclaration',
    value: function reduceVariableDeclaration(node, _ref72) {
      var declarators = _ref72.declarators;

      return new Shift.VariableDeclaration({ kind: node.kind, declarators: declarators });
    }
  }, {
    key: 'reduceVariableDeclarationStatement',
    value: function reduceVariableDeclarationStatement(node, _ref73) {
      var declaration = _ref73.declaration;

      return new Shift.VariableDeclarationStatement({ declaration: declaration });
    }
  }, {
    key: 'reduceVariableDeclarator',
    value: function reduceVariableDeclarator(node, _ref74) {
      var binding = _ref74.binding,
          init = _ref74.init;

      return new Shift.VariableDeclarator({ binding: binding, init: init });
    }
  }, {
    key: 'reduceWhileStatement',
    value: function reduceWhileStatement(node, _ref75) {
      var test = _ref75.test,
          body = _ref75.body;

      return new Shift.WhileStatement({ test: test, body: body });
    }
  }, {
    key: 'reduceWithStatement',
    value: function reduceWithStatement(node, _ref76) {
      var object = _ref76.object,
          body = _ref76.body;

      return new Shift.WithStatement({ object: object, body: body });
    }
  }, {
    key: 'reduceYieldExpression',
    value: function reduceYieldExpression(node, _ref77) {
      var expression = _ref77.expression;

      return new Shift.YieldExpression({ expression: expression });
    }
  }, {
    key: 'reduceYieldGeneratorExpression',
    value: function reduceYieldGeneratorExpression(node, _ref78) {
      var expression = _ref78.expression;

      return new Shift.YieldGeneratorExpression({ expression: expression });
    }
  }]);

  return CloneReducer;
}();

exports.default = CloneReducer;
});

var lazyCloneReducer = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Generated by generate-lazy-clone-reducer.js
/**
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



var Shift = _interopRequireWildcard(dist$2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LazyCloneReducer = function () {
  function LazyCloneReducer() {
    _classCallCheck(this, LazyCloneReducer);
  }

  _createClass(LazyCloneReducer, [{
    key: 'reduceArrayAssignmentTarget',
    value: function reduceArrayAssignmentTarget(node, _ref) {
      var elements = _ref.elements,
          rest = _ref.rest;

      if (node.elements.length === elements.length && node.elements.every(function (v, i) {
        return v === elements[i];
      }) && node.rest === rest) {
        return node;
      }
      return new Shift.ArrayAssignmentTarget({ elements: elements, rest: rest });
    }
  }, {
    key: 'reduceArrayBinding',
    value: function reduceArrayBinding(node, _ref2) {
      var elements = _ref2.elements,
          rest = _ref2.rest;

      if (node.elements.length === elements.length && node.elements.every(function (v, i) {
        return v === elements[i];
      }) && node.rest === rest) {
        return node;
      }
      return new Shift.ArrayBinding({ elements: elements, rest: rest });
    }
  }, {
    key: 'reduceArrayExpression',
    value: function reduceArrayExpression(node, _ref3) {
      var elements = _ref3.elements;

      if (node.elements.length === elements.length && node.elements.every(function (v, i) {
        return v === elements[i];
      })) {
        return node;
      }
      return new Shift.ArrayExpression({ elements: elements });
    }
  }, {
    key: 'reduceArrowExpression',
    value: function reduceArrowExpression(node, _ref4) {
      var params = _ref4.params,
          body = _ref4.body;

      if (node.params === params && node.body === body) {
        return node;
      }
      return new Shift.ArrowExpression({ isAsync: node.isAsync, params: params, body: body });
    }
  }, {
    key: 'reduceAssignmentExpression',
    value: function reduceAssignmentExpression(node, _ref5) {
      var binding = _ref5.binding,
          expression = _ref5.expression;

      if (node.binding === binding && node.expression === expression) {
        return node;
      }
      return new Shift.AssignmentExpression({ binding: binding, expression: expression });
    }
  }, {
    key: 'reduceAssignmentTargetIdentifier',
    value: function reduceAssignmentTargetIdentifier(node) {
      return node;
    }
  }, {
    key: 'reduceAssignmentTargetPropertyIdentifier',
    value: function reduceAssignmentTargetPropertyIdentifier(node, _ref6) {
      var binding = _ref6.binding,
          init = _ref6.init;

      if (node.binding === binding && node.init === init) {
        return node;
      }
      return new Shift.AssignmentTargetPropertyIdentifier({ binding: binding, init: init });
    }
  }, {
    key: 'reduceAssignmentTargetPropertyProperty',
    value: function reduceAssignmentTargetPropertyProperty(node, _ref7) {
      var name = _ref7.name,
          binding = _ref7.binding;

      if (node.name === name && node.binding === binding) {
        return node;
      }
      return new Shift.AssignmentTargetPropertyProperty({ name: name, binding: binding });
    }
  }, {
    key: 'reduceAssignmentTargetWithDefault',
    value: function reduceAssignmentTargetWithDefault(node, _ref8) {
      var binding = _ref8.binding,
          init = _ref8.init;

      if (node.binding === binding && node.init === init) {
        return node;
      }
      return new Shift.AssignmentTargetWithDefault({ binding: binding, init: init });
    }
  }, {
    key: 'reduceAwaitExpression',
    value: function reduceAwaitExpression(node, _ref9) {
      var expression = _ref9.expression;

      if (node.expression === expression) {
        return node;
      }
      return new Shift.AwaitExpression({ expression: expression });
    }
  }, {
    key: 'reduceBinaryExpression',
    value: function reduceBinaryExpression(node, _ref10) {
      var left = _ref10.left,
          right = _ref10.right;

      if (node.left === left && node.right === right) {
        return node;
      }
      return new Shift.BinaryExpression({ left: left, operator: node.operator, right: right });
    }
  }, {
    key: 'reduceBindingIdentifier',
    value: function reduceBindingIdentifier(node) {
      return node;
    }
  }, {
    key: 'reduceBindingPropertyIdentifier',
    value: function reduceBindingPropertyIdentifier(node, _ref11) {
      var binding = _ref11.binding,
          init = _ref11.init;

      if (node.binding === binding && node.init === init) {
        return node;
      }
      return new Shift.BindingPropertyIdentifier({ binding: binding, init: init });
    }
  }, {
    key: 'reduceBindingPropertyProperty',
    value: function reduceBindingPropertyProperty(node, _ref12) {
      var name = _ref12.name,
          binding = _ref12.binding;

      if (node.name === name && node.binding === binding) {
        return node;
      }
      return new Shift.BindingPropertyProperty({ name: name, binding: binding });
    }
  }, {
    key: 'reduceBindingWithDefault',
    value: function reduceBindingWithDefault(node, _ref13) {
      var binding = _ref13.binding,
          init = _ref13.init;

      if (node.binding === binding && node.init === init) {
        return node;
      }
      return new Shift.BindingWithDefault({ binding: binding, init: init });
    }
  }, {
    key: 'reduceBlock',
    value: function reduceBlock(node, _ref14) {
      var statements = _ref14.statements;

      if (node.statements.length === statements.length && node.statements.every(function (v, i) {
        return v === statements[i];
      })) {
        return node;
      }
      return new Shift.Block({ statements: statements });
    }
  }, {
    key: 'reduceBlockStatement',
    value: function reduceBlockStatement(node, _ref15) {
      var block = _ref15.block;

      if (node.block === block) {
        return node;
      }
      return new Shift.BlockStatement({ block: block });
    }
  }, {
    key: 'reduceBreakStatement',
    value: function reduceBreakStatement(node) {
      return node;
    }
  }, {
    key: 'reduceCallExpression',
    value: function reduceCallExpression(node, _ref16) {
      var callee = _ref16.callee,
          _arguments = _ref16.arguments;

      if (node.callee === callee && node.arguments.length === _arguments.length && node.arguments.every(function (v, i) {
        return v === _arguments[i];
      })) {
        return node;
      }
      return new Shift.CallExpression({ callee: callee, arguments: _arguments });
    }
  }, {
    key: 'reduceCatchClause',
    value: function reduceCatchClause(node, _ref17) {
      var binding = _ref17.binding,
          body = _ref17.body;

      if (node.binding === binding && node.body === body) {
        return node;
      }
      return new Shift.CatchClause({ binding: binding, body: body });
    }
  }, {
    key: 'reduceClassDeclaration',
    value: function reduceClassDeclaration(node, _ref18) {
      var name = _ref18.name,
          _super = _ref18.super,
          elements = _ref18.elements;

      if (node.name === name && node.super === _super && node.elements.length === elements.length && node.elements.every(function (v, i) {
        return v === elements[i];
      })) {
        return node;
      }
      return new Shift.ClassDeclaration({ name: name, super: _super, elements: elements });
    }
  }, {
    key: 'reduceClassElement',
    value: function reduceClassElement(node, _ref19) {
      var method = _ref19.method;

      if (node.method === method) {
        return node;
      }
      return new Shift.ClassElement({ isStatic: node.isStatic, method: method });
    }
  }, {
    key: 'reduceClassExpression',
    value: function reduceClassExpression(node, _ref20) {
      var name = _ref20.name,
          _super = _ref20.super,
          elements = _ref20.elements;

      if (node.name === name && node.super === _super && node.elements.length === elements.length && node.elements.every(function (v, i) {
        return v === elements[i];
      })) {
        return node;
      }
      return new Shift.ClassExpression({ name: name, super: _super, elements: elements });
    }
  }, {
    key: 'reduceCompoundAssignmentExpression',
    value: function reduceCompoundAssignmentExpression(node, _ref21) {
      var binding = _ref21.binding,
          expression = _ref21.expression;

      if (node.binding === binding && node.expression === expression) {
        return node;
      }
      return new Shift.CompoundAssignmentExpression({ binding: binding, operator: node.operator, expression: expression });
    }
  }, {
    key: 'reduceComputedMemberAssignmentTarget',
    value: function reduceComputedMemberAssignmentTarget(node, _ref22) {
      var object = _ref22.object,
          expression = _ref22.expression;

      if (node.object === object && node.expression === expression) {
        return node;
      }
      return new Shift.ComputedMemberAssignmentTarget({ object: object, expression: expression });
    }
  }, {
    key: 'reduceComputedMemberExpression',
    value: function reduceComputedMemberExpression(node, _ref23) {
      var object = _ref23.object,
          expression = _ref23.expression;

      if (node.object === object && node.expression === expression) {
        return node;
      }
      return new Shift.ComputedMemberExpression({ object: object, expression: expression });
    }
  }, {
    key: 'reduceComputedPropertyName',
    value: function reduceComputedPropertyName(node, _ref24) {
      var expression = _ref24.expression;

      if (node.expression === expression) {
        return node;
      }
      return new Shift.ComputedPropertyName({ expression: expression });
    }
  }, {
    key: 'reduceConditionalExpression',
    value: function reduceConditionalExpression(node, _ref25) {
      var test = _ref25.test,
          consequent = _ref25.consequent,
          alternate = _ref25.alternate;

      if (node.test === test && node.consequent === consequent && node.alternate === alternate) {
        return node;
      }
      return new Shift.ConditionalExpression({ test: test, consequent: consequent, alternate: alternate });
    }
  }, {
    key: 'reduceContinueStatement',
    value: function reduceContinueStatement(node) {
      return node;
    }
  }, {
    key: 'reduceDataProperty',
    value: function reduceDataProperty(node, _ref26) {
      var name = _ref26.name,
          expression = _ref26.expression;

      if (node.name === name && node.expression === expression) {
        return node;
      }
      return new Shift.DataProperty({ name: name, expression: expression });
    }
  }, {
    key: 'reduceDebuggerStatement',
    value: function reduceDebuggerStatement(node) {
      return node;
    }
  }, {
    key: 'reduceDirective',
    value: function reduceDirective(node) {
      return node;
    }
  }, {
    key: 'reduceDoWhileStatement',
    value: function reduceDoWhileStatement(node, _ref27) {
      var body = _ref27.body,
          test = _ref27.test;

      if (node.body === body && node.test === test) {
        return node;
      }
      return new Shift.DoWhileStatement({ body: body, test: test });
    }
  }, {
    key: 'reduceEmptyStatement',
    value: function reduceEmptyStatement(node) {
      return node;
    }
  }, {
    key: 'reduceExport',
    value: function reduceExport(node, _ref28) {
      var declaration = _ref28.declaration;

      if (node.declaration === declaration) {
        return node;
      }
      return new Shift.Export({ declaration: declaration });
    }
  }, {
    key: 'reduceExportAllFrom',
    value: function reduceExportAllFrom(node) {
      return node;
    }
  }, {
    key: 'reduceExportDefault',
    value: function reduceExportDefault(node, _ref29) {
      var body = _ref29.body;

      if (node.body === body) {
        return node;
      }
      return new Shift.ExportDefault({ body: body });
    }
  }, {
    key: 'reduceExportFrom',
    value: function reduceExportFrom(node, _ref30) {
      var namedExports = _ref30.namedExports;

      if (node.namedExports.length === namedExports.length && node.namedExports.every(function (v, i) {
        return v === namedExports[i];
      })) {
        return node;
      }
      return new Shift.ExportFrom({ namedExports: namedExports, moduleSpecifier: node.moduleSpecifier });
    }
  }, {
    key: 'reduceExportFromSpecifier',
    value: function reduceExportFromSpecifier(node) {
      return node;
    }
  }, {
    key: 'reduceExportLocalSpecifier',
    value: function reduceExportLocalSpecifier(node, _ref31) {
      var name = _ref31.name;

      if (node.name === name) {
        return node;
      }
      return new Shift.ExportLocalSpecifier({ name: name, exportedName: node.exportedName });
    }
  }, {
    key: 'reduceExportLocals',
    value: function reduceExportLocals(node, _ref32) {
      var namedExports = _ref32.namedExports;

      if (node.namedExports.length === namedExports.length && node.namedExports.every(function (v, i) {
        return v === namedExports[i];
      })) {
        return node;
      }
      return new Shift.ExportLocals({ namedExports: namedExports });
    }
  }, {
    key: 'reduceExpressionStatement',
    value: function reduceExpressionStatement(node, _ref33) {
      var expression = _ref33.expression;

      if (node.expression === expression) {
        return node;
      }
      return new Shift.ExpressionStatement({ expression: expression });
    }
  }, {
    key: 'reduceForAwaitStatement',
    value: function reduceForAwaitStatement(node, _ref34) {
      var left = _ref34.left,
          right = _ref34.right,
          body = _ref34.body;

      if (node.left === left && node.right === right && node.body === body) {
        return node;
      }
      return new Shift.ForAwaitStatement({ left: left, right: right, body: body });
    }
  }, {
    key: 'reduceForInStatement',
    value: function reduceForInStatement(node, _ref35) {
      var left = _ref35.left,
          right = _ref35.right,
          body = _ref35.body;

      if (node.left === left && node.right === right && node.body === body) {
        return node;
      }
      return new Shift.ForInStatement({ left: left, right: right, body: body });
    }
  }, {
    key: 'reduceForOfStatement',
    value: function reduceForOfStatement(node, _ref36) {
      var left = _ref36.left,
          right = _ref36.right,
          body = _ref36.body;

      if (node.left === left && node.right === right && node.body === body) {
        return node;
      }
      return new Shift.ForOfStatement({ left: left, right: right, body: body });
    }
  }, {
    key: 'reduceForStatement',
    value: function reduceForStatement(node, _ref37) {
      var init = _ref37.init,
          test = _ref37.test,
          update = _ref37.update,
          body = _ref37.body;

      if (node.init === init && node.test === test && node.update === update && node.body === body) {
        return node;
      }
      return new Shift.ForStatement({ init: init, test: test, update: update, body: body });
    }
  }, {
    key: 'reduceFormalParameters',
    value: function reduceFormalParameters(node, _ref38) {
      var items = _ref38.items,
          rest = _ref38.rest;

      if (node.items.length === items.length && node.items.every(function (v, i) {
        return v === items[i];
      }) && node.rest === rest) {
        return node;
      }
      return new Shift.FormalParameters({ items: items, rest: rest });
    }
  }, {
    key: 'reduceFunctionBody',
    value: function reduceFunctionBody(node, _ref39) {
      var directives = _ref39.directives,
          statements = _ref39.statements;

      if (node.directives.length === directives.length && node.directives.every(function (v, i) {
        return v === directives[i];
      }) && node.statements.length === statements.length && node.statements.every(function (v, i) {
        return v === statements[i];
      })) {
        return node;
      }
      return new Shift.FunctionBody({ directives: directives, statements: statements });
    }
  }, {
    key: 'reduceFunctionDeclaration',
    value: function reduceFunctionDeclaration(node, _ref40) {
      var name = _ref40.name,
          params = _ref40.params,
          body = _ref40.body;

      if (node.name === name && node.params === params && node.body === body) {
        return node;
      }
      return new Shift.FunctionDeclaration({ isAsync: node.isAsync, isGenerator: node.isGenerator, name: name, params: params, body: body });
    }
  }, {
    key: 'reduceFunctionExpression',
    value: function reduceFunctionExpression(node, _ref41) {
      var name = _ref41.name,
          params = _ref41.params,
          body = _ref41.body;

      if (node.name === name && node.params === params && node.body === body) {
        return node;
      }
      return new Shift.FunctionExpression({ isAsync: node.isAsync, isGenerator: node.isGenerator, name: name, params: params, body: body });
    }
  }, {
    key: 'reduceGetter',
    value: function reduceGetter(node, _ref42) {
      var name = _ref42.name,
          body = _ref42.body;

      if (node.name === name && node.body === body) {
        return node;
      }
      return new Shift.Getter({ name: name, body: body });
    }
  }, {
    key: 'reduceIdentifierExpression',
    value: function reduceIdentifierExpression(node) {
      return node;
    }
  }, {
    key: 'reduceIfStatement',
    value: function reduceIfStatement(node, _ref43) {
      var test = _ref43.test,
          consequent = _ref43.consequent,
          alternate = _ref43.alternate;

      if (node.test === test && node.consequent === consequent && node.alternate === alternate) {
        return node;
      }
      return new Shift.IfStatement({ test: test, consequent: consequent, alternate: alternate });
    }
  }, {
    key: 'reduceImport',
    value: function reduceImport(node, _ref44) {
      var defaultBinding = _ref44.defaultBinding,
          namedImports = _ref44.namedImports;

      if (node.defaultBinding === defaultBinding && node.namedImports.length === namedImports.length && node.namedImports.every(function (v, i) {
        return v === namedImports[i];
      })) {
        return node;
      }
      return new Shift.Import({ defaultBinding: defaultBinding, namedImports: namedImports, moduleSpecifier: node.moduleSpecifier });
    }
  }, {
    key: 'reduceImportNamespace',
    value: function reduceImportNamespace(node, _ref45) {
      var defaultBinding = _ref45.defaultBinding,
          namespaceBinding = _ref45.namespaceBinding;

      if (node.defaultBinding === defaultBinding && node.namespaceBinding === namespaceBinding) {
        return node;
      }
      return new Shift.ImportNamespace({ defaultBinding: defaultBinding, namespaceBinding: namespaceBinding, moduleSpecifier: node.moduleSpecifier });
    }
  }, {
    key: 'reduceImportSpecifier',
    value: function reduceImportSpecifier(node, _ref46) {
      var binding = _ref46.binding;

      if (node.binding === binding) {
        return node;
      }
      return new Shift.ImportSpecifier({ name: node.name, binding: binding });
    }
  }, {
    key: 'reduceLabeledStatement',
    value: function reduceLabeledStatement(node, _ref47) {
      var body = _ref47.body;

      if (node.body === body) {
        return node;
      }
      return new Shift.LabeledStatement({ label: node.label, body: body });
    }
  }, {
    key: 'reduceLiteralBooleanExpression',
    value: function reduceLiteralBooleanExpression(node) {
      return node;
    }
  }, {
    key: 'reduceLiteralInfinityExpression',
    value: function reduceLiteralInfinityExpression(node) {
      return node;
    }
  }, {
    key: 'reduceLiteralNullExpression',
    value: function reduceLiteralNullExpression(node) {
      return node;
    }
  }, {
    key: 'reduceLiteralNumericExpression',
    value: function reduceLiteralNumericExpression(node) {
      return node;
    }
  }, {
    key: 'reduceLiteralRegExpExpression',
    value: function reduceLiteralRegExpExpression(node) {
      return node;
    }
  }, {
    key: 'reduceLiteralStringExpression',
    value: function reduceLiteralStringExpression(node) {
      return node;
    }
  }, {
    key: 'reduceMethod',
    value: function reduceMethod(node, _ref48) {
      var name = _ref48.name,
          params = _ref48.params,
          body = _ref48.body;

      if (node.name === name && node.params === params && node.body === body) {
        return node;
      }
      return new Shift.Method({ isAsync: node.isAsync, isGenerator: node.isGenerator, name: name, params: params, body: body });
    }
  }, {
    key: 'reduceModule',
    value: function reduceModule(node, _ref49) {
      var directives = _ref49.directives,
          items = _ref49.items;

      if (node.directives.length === directives.length && node.directives.every(function (v, i) {
        return v === directives[i];
      }) && node.items.length === items.length && node.items.every(function (v, i) {
        return v === items[i];
      })) {
        return node;
      }
      return new Shift.Module({ directives: directives, items: items });
    }
  }, {
    key: 'reduceNewExpression',
    value: function reduceNewExpression(node, _ref50) {
      var callee = _ref50.callee,
          _arguments = _ref50.arguments;

      if (node.callee === callee && node.arguments.length === _arguments.length && node.arguments.every(function (v, i) {
        return v === _arguments[i];
      })) {
        return node;
      }
      return new Shift.NewExpression({ callee: callee, arguments: _arguments });
    }
  }, {
    key: 'reduceNewTargetExpression',
    value: function reduceNewTargetExpression(node) {
      return node;
    }
  }, {
    key: 'reduceObjectAssignmentTarget',
    value: function reduceObjectAssignmentTarget(node, _ref51) {
      var properties = _ref51.properties,
          rest = _ref51.rest;

      if (node.properties.length === properties.length && node.properties.every(function (v, i) {
        return v === properties[i];
      }) && node.rest === rest) {
        return node;
      }
      return new Shift.ObjectAssignmentTarget({ properties: properties, rest: rest });
    }
  }, {
    key: 'reduceObjectBinding',
    value: function reduceObjectBinding(node, _ref52) {
      var properties = _ref52.properties,
          rest = _ref52.rest;

      if (node.properties.length === properties.length && node.properties.every(function (v, i) {
        return v === properties[i];
      }) && node.rest === rest) {
        return node;
      }
      return new Shift.ObjectBinding({ properties: properties, rest: rest });
    }
  }, {
    key: 'reduceObjectExpression',
    value: function reduceObjectExpression(node, _ref53) {
      var properties = _ref53.properties;

      if (node.properties.length === properties.length && node.properties.every(function (v, i) {
        return v === properties[i];
      })) {
        return node;
      }
      return new Shift.ObjectExpression({ properties: properties });
    }
  }, {
    key: 'reduceReturnStatement',
    value: function reduceReturnStatement(node, _ref54) {
      var expression = _ref54.expression;

      if (node.expression === expression) {
        return node;
      }
      return new Shift.ReturnStatement({ expression: expression });
    }
  }, {
    key: 'reduceScript',
    value: function reduceScript(node, _ref55) {
      var directives = _ref55.directives,
          statements = _ref55.statements;

      if (node.directives.length === directives.length && node.directives.every(function (v, i) {
        return v === directives[i];
      }) && node.statements.length === statements.length && node.statements.every(function (v, i) {
        return v === statements[i];
      })) {
        return node;
      }
      return new Shift.Script({ directives: directives, statements: statements });
    }
  }, {
    key: 'reduceSetter',
    value: function reduceSetter(node, _ref56) {
      var name = _ref56.name,
          param = _ref56.param,
          body = _ref56.body;

      if (node.name === name && node.param === param && node.body === body) {
        return node;
      }
      return new Shift.Setter({ name: name, param: param, body: body });
    }
  }, {
    key: 'reduceShorthandProperty',
    value: function reduceShorthandProperty(node, _ref57) {
      var name = _ref57.name;

      if (node.name === name) {
        return node;
      }
      return new Shift.ShorthandProperty({ name: name });
    }
  }, {
    key: 'reduceSpreadElement',
    value: function reduceSpreadElement(node, _ref58) {
      var expression = _ref58.expression;

      if (node.expression === expression) {
        return node;
      }
      return new Shift.SpreadElement({ expression: expression });
    }
  }, {
    key: 'reduceSpreadProperty',
    value: function reduceSpreadProperty(node, _ref59) {
      var expression = _ref59.expression;

      if (node.expression === expression) {
        return node;
      }
      return new Shift.SpreadProperty({ expression: expression });
    }
  }, {
    key: 'reduceStaticMemberAssignmentTarget',
    value: function reduceStaticMemberAssignmentTarget(node, _ref60) {
      var object = _ref60.object;

      if (node.object === object) {
        return node;
      }
      return new Shift.StaticMemberAssignmentTarget({ object: object, property: node.property });
    }
  }, {
    key: 'reduceStaticMemberExpression',
    value: function reduceStaticMemberExpression(node, _ref61) {
      var object = _ref61.object;

      if (node.object === object) {
        return node;
      }
      return new Shift.StaticMemberExpression({ object: object, property: node.property });
    }
  }, {
    key: 'reduceStaticPropertyName',
    value: function reduceStaticPropertyName(node) {
      return node;
    }
  }, {
    key: 'reduceSuper',
    value: function reduceSuper(node) {
      return node;
    }
  }, {
    key: 'reduceSwitchCase',
    value: function reduceSwitchCase(node, _ref62) {
      var test = _ref62.test,
          consequent = _ref62.consequent;

      if (node.test === test && node.consequent.length === consequent.length && node.consequent.every(function (v, i) {
        return v === consequent[i];
      })) {
        return node;
      }
      return new Shift.SwitchCase({ test: test, consequent: consequent });
    }
  }, {
    key: 'reduceSwitchDefault',
    value: function reduceSwitchDefault(node, _ref63) {
      var consequent = _ref63.consequent;

      if (node.consequent.length === consequent.length && node.consequent.every(function (v, i) {
        return v === consequent[i];
      })) {
        return node;
      }
      return new Shift.SwitchDefault({ consequent: consequent });
    }
  }, {
    key: 'reduceSwitchStatement',
    value: function reduceSwitchStatement(node, _ref64) {
      var discriminant = _ref64.discriminant,
          cases = _ref64.cases;

      if (node.discriminant === discriminant && node.cases.length === cases.length && node.cases.every(function (v, i) {
        return v === cases[i];
      })) {
        return node;
      }
      return new Shift.SwitchStatement({ discriminant: discriminant, cases: cases });
    }
  }, {
    key: 'reduceSwitchStatementWithDefault',
    value: function reduceSwitchStatementWithDefault(node, _ref65) {
      var discriminant = _ref65.discriminant,
          preDefaultCases = _ref65.preDefaultCases,
          defaultCase = _ref65.defaultCase,
          postDefaultCases = _ref65.postDefaultCases;

      if (node.discriminant === discriminant && node.preDefaultCases.length === preDefaultCases.length && node.preDefaultCases.every(function (v, i) {
        return v === preDefaultCases[i];
      }) && node.defaultCase === defaultCase && node.postDefaultCases.length === postDefaultCases.length && node.postDefaultCases.every(function (v, i) {
        return v === postDefaultCases[i];
      })) {
        return node;
      }
      return new Shift.SwitchStatementWithDefault({ discriminant: discriminant, preDefaultCases: preDefaultCases, defaultCase: defaultCase, postDefaultCases: postDefaultCases });
    }
  }, {
    key: 'reduceTemplateElement',
    value: function reduceTemplateElement(node) {
      return node;
    }
  }, {
    key: 'reduceTemplateExpression',
    value: function reduceTemplateExpression(node, _ref66) {
      var tag = _ref66.tag,
          elements = _ref66.elements;

      if (node.tag === tag && node.elements.length === elements.length && node.elements.every(function (v, i) {
        return v === elements[i];
      })) {
        return node;
      }
      return new Shift.TemplateExpression({ tag: tag, elements: elements });
    }
  }, {
    key: 'reduceThisExpression',
    value: function reduceThisExpression(node) {
      return node;
    }
  }, {
    key: 'reduceThrowStatement',
    value: function reduceThrowStatement(node, _ref67) {
      var expression = _ref67.expression;

      if (node.expression === expression) {
        return node;
      }
      return new Shift.ThrowStatement({ expression: expression });
    }
  }, {
    key: 'reduceTryCatchStatement',
    value: function reduceTryCatchStatement(node, _ref68) {
      var body = _ref68.body,
          catchClause = _ref68.catchClause;

      if (node.body === body && node.catchClause === catchClause) {
        return node;
      }
      return new Shift.TryCatchStatement({ body: body, catchClause: catchClause });
    }
  }, {
    key: 'reduceTryFinallyStatement',
    value: function reduceTryFinallyStatement(node, _ref69) {
      var body = _ref69.body,
          catchClause = _ref69.catchClause,
          finalizer = _ref69.finalizer;

      if (node.body === body && node.catchClause === catchClause && node.finalizer === finalizer) {
        return node;
      }
      return new Shift.TryFinallyStatement({ body: body, catchClause: catchClause, finalizer: finalizer });
    }
  }, {
    key: 'reduceUnaryExpression',
    value: function reduceUnaryExpression(node, _ref70) {
      var operand = _ref70.operand;

      if (node.operand === operand) {
        return node;
      }
      return new Shift.UnaryExpression({ operator: node.operator, operand: operand });
    }
  }, {
    key: 'reduceUpdateExpression',
    value: function reduceUpdateExpression(node, _ref71) {
      var operand = _ref71.operand;

      if (node.operand === operand) {
        return node;
      }
      return new Shift.UpdateExpression({ isPrefix: node.isPrefix, operator: node.operator, operand: operand });
    }
  }, {
    key: 'reduceVariableDeclaration',
    value: function reduceVariableDeclaration(node, _ref72) {
      var declarators = _ref72.declarators;

      if (node.declarators.length === declarators.length && node.declarators.every(function (v, i) {
        return v === declarators[i];
      })) {
        return node;
      }
      return new Shift.VariableDeclaration({ kind: node.kind, declarators: declarators });
    }
  }, {
    key: 'reduceVariableDeclarationStatement',
    value: function reduceVariableDeclarationStatement(node, _ref73) {
      var declaration = _ref73.declaration;

      if (node.declaration === declaration) {
        return node;
      }
      return new Shift.VariableDeclarationStatement({ declaration: declaration });
    }
  }, {
    key: 'reduceVariableDeclarator',
    value: function reduceVariableDeclarator(node, _ref74) {
      var binding = _ref74.binding,
          init = _ref74.init;

      if (node.binding === binding && node.init === init) {
        return node;
      }
      return new Shift.VariableDeclarator({ binding: binding, init: init });
    }
  }, {
    key: 'reduceWhileStatement',
    value: function reduceWhileStatement(node, _ref75) {
      var test = _ref75.test,
          body = _ref75.body;

      if (node.test === test && node.body === body) {
        return node;
      }
      return new Shift.WhileStatement({ test: test, body: body });
    }
  }, {
    key: 'reduceWithStatement',
    value: function reduceWithStatement(node, _ref76) {
      var object = _ref76.object,
          body = _ref76.body;

      if (node.object === object && node.body === body) {
        return node;
      }
      return new Shift.WithStatement({ object: object, body: body });
    }
  }, {
    key: 'reduceYieldExpression',
    value: function reduceYieldExpression(node, _ref77) {
      var expression = _ref77.expression;

      if (node.expression === expression) {
        return node;
      }
      return new Shift.YieldExpression({ expression: expression });
    }
  }, {
    key: 'reduceYieldGeneratorExpression',
    value: function reduceYieldGeneratorExpression(node, _ref78) {
      var expression = _ref78.expression;

      if (node.expression === expression) {
        return node;
      }
      return new Shift.YieldGeneratorExpression({ expression: expression });
    }
  }]);

  return LazyCloneReducer;
}();

exports.default = LazyCloneReducer;
});

var monoidalReducer = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Generated by generate-monoidal-reducer.js
/**
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



var _shiftAst2 = _interopRequireDefault(dist$2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MonoidalReducer = function () {
  function MonoidalReducer(monoid) {
    _classCallCheck(this, MonoidalReducer);

    var identity = monoid.empty();
    this.identity = identity;
    var concat = void 0;
    if (monoid.prototype && typeof monoid.prototype.concat === 'function') {
      concat = Function.prototype.call.bind(monoid.prototype.concat);
    } else if (typeof monoid.concat === 'function') {
      concat = monoid.concat;
    } else {
      throw new TypeError('Monoid must provide a `concat` method');
    }
    this.append = function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return args.reduce(concat, identity);
    };
  }

  _createClass(MonoidalReducer, [{
    key: 'reduceArrayAssignmentTarget',
    value: function reduceArrayAssignmentTarget(node, _ref) {
      var elements = _ref.elements,
          rest = _ref.rest;

      return this.append.apply(this, _toConsumableArray(elements.filter(function (n) {
        return n != null;
      })).concat([rest == null ? this.identity : rest]));
    }
  }, {
    key: 'reduceArrayBinding',
    value: function reduceArrayBinding(node, _ref2) {
      var elements = _ref2.elements,
          rest = _ref2.rest;

      return this.append.apply(this, _toConsumableArray(elements.filter(function (n) {
        return n != null;
      })).concat([rest == null ? this.identity : rest]));
    }
  }, {
    key: 'reduceArrayExpression',
    value: function reduceArrayExpression(node, _ref3) {
      var elements = _ref3.elements;

      return this.append.apply(this, _toConsumableArray(elements.filter(function (n) {
        return n != null;
      })));
    }
  }, {
    key: 'reduceArrowExpression',
    value: function reduceArrowExpression(node, _ref4) {
      var params = _ref4.params,
          body = _ref4.body;

      return this.append(params, body);
    }
  }, {
    key: 'reduceAssignmentExpression',
    value: function reduceAssignmentExpression(node, _ref5) {
      var binding = _ref5.binding,
          expression = _ref5.expression;

      return this.append(binding, expression);
    }
  }, {
    key: 'reduceAssignmentTargetIdentifier',
    value: function reduceAssignmentTargetIdentifier(node) {
      return this.identity;
    }
  }, {
    key: 'reduceAssignmentTargetPropertyIdentifier',
    value: function reduceAssignmentTargetPropertyIdentifier(node, _ref6) {
      var binding = _ref6.binding,
          init = _ref6.init;

      return this.append(binding, init == null ? this.identity : init);
    }
  }, {
    key: 'reduceAssignmentTargetPropertyProperty',
    value: function reduceAssignmentTargetPropertyProperty(node, _ref7) {
      var name = _ref7.name,
          binding = _ref7.binding;

      return this.append(name, binding);
    }
  }, {
    key: 'reduceAssignmentTargetWithDefault',
    value: function reduceAssignmentTargetWithDefault(node, _ref8) {
      var binding = _ref8.binding,
          init = _ref8.init;

      return this.append(binding, init);
    }
  }, {
    key: 'reduceAwaitExpression',
    value: function reduceAwaitExpression(node, _ref9) {
      var expression = _ref9.expression;

      return expression;
    }
  }, {
    key: 'reduceBinaryExpression',
    value: function reduceBinaryExpression(node, _ref10) {
      var left = _ref10.left,
          right = _ref10.right;

      return this.append(left, right);
    }
  }, {
    key: 'reduceBindingIdentifier',
    value: function reduceBindingIdentifier(node) {
      return this.identity;
    }
  }, {
    key: 'reduceBindingPropertyIdentifier',
    value: function reduceBindingPropertyIdentifier(node, _ref11) {
      var binding = _ref11.binding,
          init = _ref11.init;

      return this.append(binding, init == null ? this.identity : init);
    }
  }, {
    key: 'reduceBindingPropertyProperty',
    value: function reduceBindingPropertyProperty(node, _ref12) {
      var name = _ref12.name,
          binding = _ref12.binding;

      return this.append(name, binding);
    }
  }, {
    key: 'reduceBindingWithDefault',
    value: function reduceBindingWithDefault(node, _ref13) {
      var binding = _ref13.binding,
          init = _ref13.init;

      return this.append(binding, init);
    }
  }, {
    key: 'reduceBlock',
    value: function reduceBlock(node, _ref14) {
      var statements = _ref14.statements;

      return this.append.apply(this, _toConsumableArray(statements));
    }
  }, {
    key: 'reduceBlockStatement',
    value: function reduceBlockStatement(node, _ref15) {
      var block = _ref15.block;

      return block;
    }
  }, {
    key: 'reduceBreakStatement',
    value: function reduceBreakStatement(node) {
      return this.identity;
    }
  }, {
    key: 'reduceCallExpression',
    value: function reduceCallExpression(node, _ref16) {
      var callee = _ref16.callee,
          _arguments = _ref16.arguments;

      return this.append.apply(this, [callee].concat(_toConsumableArray(_arguments)));
    }
  }, {
    key: 'reduceCatchClause',
    value: function reduceCatchClause(node, _ref17) {
      var binding = _ref17.binding,
          body = _ref17.body;

      return this.append(binding, body);
    }
  }, {
    key: 'reduceClassDeclaration',
    value: function reduceClassDeclaration(node, _ref18) {
      var name = _ref18.name,
          _super = _ref18.super,
          elements = _ref18.elements;

      return this.append.apply(this, [name, _super == null ? this.identity : _super].concat(_toConsumableArray(elements)));
    }
  }, {
    key: 'reduceClassElement',
    value: function reduceClassElement(node, _ref19) {
      var method = _ref19.method;

      return method;
    }
  }, {
    key: 'reduceClassExpression',
    value: function reduceClassExpression(node, _ref20) {
      var name = _ref20.name,
          _super = _ref20.super,
          elements = _ref20.elements;

      return this.append.apply(this, [name == null ? this.identity : name, _super == null ? this.identity : _super].concat(_toConsumableArray(elements)));
    }
  }, {
    key: 'reduceCompoundAssignmentExpression',
    value: function reduceCompoundAssignmentExpression(node, _ref21) {
      var binding = _ref21.binding,
          expression = _ref21.expression;

      return this.append(binding, expression);
    }
  }, {
    key: 'reduceComputedMemberAssignmentTarget',
    value: function reduceComputedMemberAssignmentTarget(node, _ref22) {
      var object = _ref22.object,
          expression = _ref22.expression;

      return this.append(object, expression);
    }
  }, {
    key: 'reduceComputedMemberExpression',
    value: function reduceComputedMemberExpression(node, _ref23) {
      var object = _ref23.object,
          expression = _ref23.expression;

      return this.append(object, expression);
    }
  }, {
    key: 'reduceComputedPropertyName',
    value: function reduceComputedPropertyName(node, _ref24) {
      var expression = _ref24.expression;

      return expression;
    }
  }, {
    key: 'reduceConditionalExpression',
    value: function reduceConditionalExpression(node, _ref25) {
      var test = _ref25.test,
          consequent = _ref25.consequent,
          alternate = _ref25.alternate;

      return this.append(test, consequent, alternate);
    }
  }, {
    key: 'reduceContinueStatement',
    value: function reduceContinueStatement(node) {
      return this.identity;
    }
  }, {
    key: 'reduceDataProperty',
    value: function reduceDataProperty(node, _ref26) {
      var name = _ref26.name,
          expression = _ref26.expression;

      return this.append(name, expression);
    }
  }, {
    key: 'reduceDebuggerStatement',
    value: function reduceDebuggerStatement(node) {
      return this.identity;
    }
  }, {
    key: 'reduceDirective',
    value: function reduceDirective(node) {
      return this.identity;
    }
  }, {
    key: 'reduceDoWhileStatement',
    value: function reduceDoWhileStatement(node, _ref27) {
      var body = _ref27.body,
          test = _ref27.test;

      return this.append(body, test);
    }
  }, {
    key: 'reduceEmptyStatement',
    value: function reduceEmptyStatement(node) {
      return this.identity;
    }
  }, {
    key: 'reduceExport',
    value: function reduceExport(node, _ref28) {
      var declaration = _ref28.declaration;

      return declaration;
    }
  }, {
    key: 'reduceExportAllFrom',
    value: function reduceExportAllFrom(node) {
      return this.identity;
    }
  }, {
    key: 'reduceExportDefault',
    value: function reduceExportDefault(node, _ref29) {
      var body = _ref29.body;

      return body;
    }
  }, {
    key: 'reduceExportFrom',
    value: function reduceExportFrom(node, _ref30) {
      var namedExports = _ref30.namedExports;

      return this.append.apply(this, _toConsumableArray(namedExports));
    }
  }, {
    key: 'reduceExportFromSpecifier',
    value: function reduceExportFromSpecifier(node) {
      return this.identity;
    }
  }, {
    key: 'reduceExportLocalSpecifier',
    value: function reduceExportLocalSpecifier(node, _ref31) {
      var name = _ref31.name;

      return name;
    }
  }, {
    key: 'reduceExportLocals',
    value: function reduceExportLocals(node, _ref32) {
      var namedExports = _ref32.namedExports;

      return this.append.apply(this, _toConsumableArray(namedExports));
    }
  }, {
    key: 'reduceExpressionStatement',
    value: function reduceExpressionStatement(node, _ref33) {
      var expression = _ref33.expression;

      return expression;
    }
  }, {
    key: 'reduceForAwaitStatement',
    value: function reduceForAwaitStatement(node, _ref34) {
      var left = _ref34.left,
          right = _ref34.right,
          body = _ref34.body;

      return this.append(left, right, body);
    }
  }, {
    key: 'reduceForInStatement',
    value: function reduceForInStatement(node, _ref35) {
      var left = _ref35.left,
          right = _ref35.right,
          body = _ref35.body;

      return this.append(left, right, body);
    }
  }, {
    key: 'reduceForOfStatement',
    value: function reduceForOfStatement(node, _ref36) {
      var left = _ref36.left,
          right = _ref36.right,
          body = _ref36.body;

      return this.append(left, right, body);
    }
  }, {
    key: 'reduceForStatement',
    value: function reduceForStatement(node, _ref37) {
      var init = _ref37.init,
          test = _ref37.test,
          update = _ref37.update,
          body = _ref37.body;

      return this.append(init == null ? this.identity : init, test == null ? this.identity : test, update == null ? this.identity : update, body);
    }
  }, {
    key: 'reduceFormalParameters',
    value: function reduceFormalParameters(node, _ref38) {
      var items = _ref38.items,
          rest = _ref38.rest;

      return this.append.apply(this, _toConsumableArray(items).concat([rest == null ? this.identity : rest]));
    }
  }, {
    key: 'reduceFunctionBody',
    value: function reduceFunctionBody(node, _ref39) {
      var directives = _ref39.directives,
          statements = _ref39.statements;

      return this.append.apply(this, _toConsumableArray(directives).concat(_toConsumableArray(statements)));
    }
  }, {
    key: 'reduceFunctionDeclaration',
    value: function reduceFunctionDeclaration(node, _ref40) {
      var name = _ref40.name,
          params = _ref40.params,
          body = _ref40.body;

      return this.append(name, params, body);
    }
  }, {
    key: 'reduceFunctionExpression',
    value: function reduceFunctionExpression(node, _ref41) {
      var name = _ref41.name,
          params = _ref41.params,
          body = _ref41.body;

      return this.append(name == null ? this.identity : name, params, body);
    }
  }, {
    key: 'reduceGetter',
    value: function reduceGetter(node, _ref42) {
      var name = _ref42.name,
          body = _ref42.body;

      return this.append(name, body);
    }
  }, {
    key: 'reduceIdentifierExpression',
    value: function reduceIdentifierExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceIfStatement',
    value: function reduceIfStatement(node, _ref43) {
      var test = _ref43.test,
          consequent = _ref43.consequent,
          alternate = _ref43.alternate;

      return this.append(test, consequent, alternate == null ? this.identity : alternate);
    }
  }, {
    key: 'reduceImport',
    value: function reduceImport(node, _ref44) {
      var defaultBinding = _ref44.defaultBinding,
          namedImports = _ref44.namedImports;

      return this.append.apply(this, [defaultBinding == null ? this.identity : defaultBinding].concat(_toConsumableArray(namedImports)));
    }
  }, {
    key: 'reduceImportNamespace',
    value: function reduceImportNamespace(node, _ref45) {
      var defaultBinding = _ref45.defaultBinding,
          namespaceBinding = _ref45.namespaceBinding;

      return this.append(defaultBinding == null ? this.identity : defaultBinding, namespaceBinding);
    }
  }, {
    key: 'reduceImportSpecifier',
    value: function reduceImportSpecifier(node, _ref46) {
      var binding = _ref46.binding;

      return binding;
    }
  }, {
    key: 'reduceLabeledStatement',
    value: function reduceLabeledStatement(node, _ref47) {
      var body = _ref47.body;

      return body;
    }
  }, {
    key: 'reduceLiteralBooleanExpression',
    value: function reduceLiteralBooleanExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceLiteralInfinityExpression',
    value: function reduceLiteralInfinityExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceLiteralNullExpression',
    value: function reduceLiteralNullExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceLiteralNumericExpression',
    value: function reduceLiteralNumericExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceLiteralRegExpExpression',
    value: function reduceLiteralRegExpExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceLiteralStringExpression',
    value: function reduceLiteralStringExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceMethod',
    value: function reduceMethod(node, _ref48) {
      var name = _ref48.name,
          params = _ref48.params,
          body = _ref48.body;

      return this.append(name, params, body);
    }
  }, {
    key: 'reduceModule',
    value: function reduceModule(node, _ref49) {
      var directives = _ref49.directives,
          items = _ref49.items;

      return this.append.apply(this, _toConsumableArray(directives).concat(_toConsumableArray(items)));
    }
  }, {
    key: 'reduceNewExpression',
    value: function reduceNewExpression(node, _ref50) {
      var callee = _ref50.callee,
          _arguments = _ref50.arguments;

      return this.append.apply(this, [callee].concat(_toConsumableArray(_arguments)));
    }
  }, {
    key: 'reduceNewTargetExpression',
    value: function reduceNewTargetExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceObjectAssignmentTarget',
    value: function reduceObjectAssignmentTarget(node, _ref51) {
      var properties = _ref51.properties,
          rest = _ref51.rest;

      return this.append.apply(this, _toConsumableArray(properties).concat([rest == null ? this.identity : rest]));
    }
  }, {
    key: 'reduceObjectBinding',
    value: function reduceObjectBinding(node, _ref52) {
      var properties = _ref52.properties,
          rest = _ref52.rest;

      return this.append.apply(this, _toConsumableArray(properties).concat([rest == null ? this.identity : rest]));
    }
  }, {
    key: 'reduceObjectExpression',
    value: function reduceObjectExpression(node, _ref53) {
      var properties = _ref53.properties;

      return this.append.apply(this, _toConsumableArray(properties));
    }
  }, {
    key: 'reduceReturnStatement',
    value: function reduceReturnStatement(node, _ref54) {
      var expression = _ref54.expression;

      return expression == null ? this.identity : expression;
    }
  }, {
    key: 'reduceScript',
    value: function reduceScript(node, _ref55) {
      var directives = _ref55.directives,
          statements = _ref55.statements;

      return this.append.apply(this, _toConsumableArray(directives).concat(_toConsumableArray(statements)));
    }
  }, {
    key: 'reduceSetter',
    value: function reduceSetter(node, _ref56) {
      var name = _ref56.name,
          param = _ref56.param,
          body = _ref56.body;

      return this.append(name, param, body);
    }
  }, {
    key: 'reduceShorthandProperty',
    value: function reduceShorthandProperty(node, _ref57) {
      var name = _ref57.name;

      return name;
    }
  }, {
    key: 'reduceSpreadElement',
    value: function reduceSpreadElement(node, _ref58) {
      var expression = _ref58.expression;

      return expression;
    }
  }, {
    key: 'reduceSpreadProperty',
    value: function reduceSpreadProperty(node, _ref59) {
      var expression = _ref59.expression;

      return expression;
    }
  }, {
    key: 'reduceStaticMemberAssignmentTarget',
    value: function reduceStaticMemberAssignmentTarget(node, _ref60) {
      var object = _ref60.object;

      return object;
    }
  }, {
    key: 'reduceStaticMemberExpression',
    value: function reduceStaticMemberExpression(node, _ref61) {
      var object = _ref61.object;

      return object;
    }
  }, {
    key: 'reduceStaticPropertyName',
    value: function reduceStaticPropertyName(node) {
      return this.identity;
    }
  }, {
    key: 'reduceSuper',
    value: function reduceSuper(node) {
      return this.identity;
    }
  }, {
    key: 'reduceSwitchCase',
    value: function reduceSwitchCase(node, _ref62) {
      var test = _ref62.test,
          consequent = _ref62.consequent;

      return this.append.apply(this, [test].concat(_toConsumableArray(consequent)));
    }
  }, {
    key: 'reduceSwitchDefault',
    value: function reduceSwitchDefault(node, _ref63) {
      var consequent = _ref63.consequent;

      return this.append.apply(this, _toConsumableArray(consequent));
    }
  }, {
    key: 'reduceSwitchStatement',
    value: function reduceSwitchStatement(node, _ref64) {
      var discriminant = _ref64.discriminant,
          cases = _ref64.cases;

      return this.append.apply(this, [discriminant].concat(_toConsumableArray(cases)));
    }
  }, {
    key: 'reduceSwitchStatementWithDefault',
    value: function reduceSwitchStatementWithDefault(node, _ref65) {
      var discriminant = _ref65.discriminant,
          preDefaultCases = _ref65.preDefaultCases,
          defaultCase = _ref65.defaultCase,
          postDefaultCases = _ref65.postDefaultCases;

      return this.append.apply(this, [discriminant].concat(_toConsumableArray(preDefaultCases), [defaultCase], _toConsumableArray(postDefaultCases)));
    }
  }, {
    key: 'reduceTemplateElement',
    value: function reduceTemplateElement(node) {
      return this.identity;
    }
  }, {
    key: 'reduceTemplateExpression',
    value: function reduceTemplateExpression(node, _ref66) {
      var tag = _ref66.tag,
          elements = _ref66.elements;

      return this.append.apply(this, [tag == null ? this.identity : tag].concat(_toConsumableArray(elements)));
    }
  }, {
    key: 'reduceThisExpression',
    value: function reduceThisExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceThrowStatement',
    value: function reduceThrowStatement(node, _ref67) {
      var expression = _ref67.expression;

      return expression;
    }
  }, {
    key: 'reduceTryCatchStatement',
    value: function reduceTryCatchStatement(node, _ref68) {
      var body = _ref68.body,
          catchClause = _ref68.catchClause;

      return this.append(body, catchClause);
    }
  }, {
    key: 'reduceTryFinallyStatement',
    value: function reduceTryFinallyStatement(node, _ref69) {
      var body = _ref69.body,
          catchClause = _ref69.catchClause,
          finalizer = _ref69.finalizer;

      return this.append(body, catchClause == null ? this.identity : catchClause, finalizer);
    }
  }, {
    key: 'reduceUnaryExpression',
    value: function reduceUnaryExpression(node, _ref70) {
      var operand = _ref70.operand;

      return operand;
    }
  }, {
    key: 'reduceUpdateExpression',
    value: function reduceUpdateExpression(node, _ref71) {
      var operand = _ref71.operand;

      return operand;
    }
  }, {
    key: 'reduceVariableDeclaration',
    value: function reduceVariableDeclaration(node, _ref72) {
      var declarators = _ref72.declarators;

      return this.append.apply(this, _toConsumableArray(declarators));
    }
  }, {
    key: 'reduceVariableDeclarationStatement',
    value: function reduceVariableDeclarationStatement(node, _ref73) {
      var declaration = _ref73.declaration;

      return declaration;
    }
  }, {
    key: 'reduceVariableDeclarator',
    value: function reduceVariableDeclarator(node, _ref74) {
      var binding = _ref74.binding,
          init = _ref74.init;

      return this.append(binding, init == null ? this.identity : init);
    }
  }, {
    key: 'reduceWhileStatement',
    value: function reduceWhileStatement(node, _ref75) {
      var test = _ref75.test,
          body = _ref75.body;

      return this.append(test, body);
    }
  }, {
    key: 'reduceWithStatement',
    value: function reduceWithStatement(node, _ref76) {
      var object = _ref76.object,
          body = _ref76.body;

      return this.append(object, body);
    }
  }, {
    key: 'reduceYieldExpression',
    value: function reduceYieldExpression(node, _ref77) {
      var expression = _ref77.expression;

      return expression == null ? this.identity : expression;
    }
  }, {
    key: 'reduceYieldGeneratorExpression',
    value: function reduceYieldGeneratorExpression(node, _ref78) {
      var expression = _ref78.expression;

      return expression;
    }
  }]);

  return MonoidalReducer;
}();

exports.default = MonoidalReducer;
});

var thunkedMonoidalReducer = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Generated by generate-monoidal-reducer.js
/**
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



var _shiftAst2 = _interopRequireDefault(dist$2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MonoidalReducer = function () {
  function MonoidalReducer(monoid) {
    _classCallCheck(this, MonoidalReducer);

    var identity = monoid.empty();
    this.identity = identity;

    var concatThunk = void 0;
    if (monoid.prototype && typeof monoid.prototype.concatThunk === 'function') {
      concatThunk = Function.prototype.call.bind(monoid.prototype.concatThunk);
    } else if (typeof monoid.concatThunk === 'function') {
      concatThunk = monoid.concatThunk;
    } else {
      var concat = void 0;
      if (monoid.prototype && typeof monoid.prototype.concat === 'function') {
        concat = Function.prototype.call.bind(monoid.prototype.concat);
      } else if (typeof monoid.concat === 'function') {
        concat = monoid.concat;
      } else {
        throw new TypeError('Monoid must provide a `concatThunk` or `concat` method');
      }
      if (typeof monoid.isAbsorbing === 'function') {
        var isAbsorbing = monoid.isAbsorbing;
        concatThunk = function concatThunk(a, b) {
          return isAbsorbing(a) ? a : concat(a, b());
        };
      } else {
        concatThunk = function concatThunk(a, b) {
          return concat(a, b());
        };
      }
    }
    this.append = function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return args.reduce(concatThunk, identity);
    };
  }

  _createClass(MonoidalReducer, [{
    key: 'reduceArrayAssignmentTarget',
    value: function reduceArrayAssignmentTarget(node, _ref) {
      var _this = this;

      var elements = _ref.elements,
          rest = _ref.rest;

      return this.append.apply(this, _toConsumableArray(elements.filter(function (n) {
        return n != null;
      })).concat([rest == null ? function () {
        return _this.identity;
      } : rest]));
    }
  }, {
    key: 'reduceArrayBinding',
    value: function reduceArrayBinding(node, _ref2) {
      var _this2 = this;

      var elements = _ref2.elements,
          rest = _ref2.rest;

      return this.append.apply(this, _toConsumableArray(elements.filter(function (n) {
        return n != null;
      })).concat([rest == null ? function () {
        return _this2.identity;
      } : rest]));
    }
  }, {
    key: 'reduceArrayExpression',
    value: function reduceArrayExpression(node, _ref3) {
      var elements = _ref3.elements;

      return this.append.apply(this, _toConsumableArray(elements.filter(function (n) {
        return n != null;
      })));
    }
  }, {
    key: 'reduceArrowExpression',
    value: function reduceArrowExpression(node, _ref4) {
      var params = _ref4.params,
          body = _ref4.body;

      return this.append(params, body);
    }
  }, {
    key: 'reduceAssignmentExpression',
    value: function reduceAssignmentExpression(node, _ref5) {
      var binding = _ref5.binding,
          expression = _ref5.expression;

      return this.append(binding, expression);
    }
  }, {
    key: 'reduceAssignmentTargetIdentifier',
    value: function reduceAssignmentTargetIdentifier(node) {
      return this.identity;
    }
  }, {
    key: 'reduceAssignmentTargetPropertyIdentifier',
    value: function reduceAssignmentTargetPropertyIdentifier(node, _ref6) {
      var _this3 = this;

      var binding = _ref6.binding,
          init = _ref6.init;

      return this.append(binding, init == null ? function () {
        return _this3.identity;
      } : init);
    }
  }, {
    key: 'reduceAssignmentTargetPropertyProperty',
    value: function reduceAssignmentTargetPropertyProperty(node, _ref7) {
      var name = _ref7.name,
          binding = _ref7.binding;

      return this.append(name, binding);
    }
  }, {
    key: 'reduceAssignmentTargetWithDefault',
    value: function reduceAssignmentTargetWithDefault(node, _ref8) {
      var binding = _ref8.binding,
          init = _ref8.init;

      return this.append(binding, init);
    }
  }, {
    key: 'reduceAwaitExpression',
    value: function reduceAwaitExpression(node, _ref9) {
      var expression = _ref9.expression;

      return expression();
    }
  }, {
    key: 'reduceBinaryExpression',
    value: function reduceBinaryExpression(node, _ref10) {
      var left = _ref10.left,
          right = _ref10.right;

      return this.append(left, right);
    }
  }, {
    key: 'reduceBindingIdentifier',
    value: function reduceBindingIdentifier(node) {
      return this.identity;
    }
  }, {
    key: 'reduceBindingPropertyIdentifier',
    value: function reduceBindingPropertyIdentifier(node, _ref11) {
      var _this4 = this;

      var binding = _ref11.binding,
          init = _ref11.init;

      return this.append(binding, init == null ? function () {
        return _this4.identity;
      } : init);
    }
  }, {
    key: 'reduceBindingPropertyProperty',
    value: function reduceBindingPropertyProperty(node, _ref12) {
      var name = _ref12.name,
          binding = _ref12.binding;

      return this.append(name, binding);
    }
  }, {
    key: 'reduceBindingWithDefault',
    value: function reduceBindingWithDefault(node, _ref13) {
      var binding = _ref13.binding,
          init = _ref13.init;

      return this.append(binding, init);
    }
  }, {
    key: 'reduceBlock',
    value: function reduceBlock(node, _ref14) {
      var statements = _ref14.statements;

      return this.append.apply(this, _toConsumableArray(statements));
    }
  }, {
    key: 'reduceBlockStatement',
    value: function reduceBlockStatement(node, _ref15) {
      var block = _ref15.block;

      return block();
    }
  }, {
    key: 'reduceBreakStatement',
    value: function reduceBreakStatement(node) {
      return this.identity;
    }
  }, {
    key: 'reduceCallExpression',
    value: function reduceCallExpression(node, _ref16) {
      var callee = _ref16.callee,
          _arguments = _ref16.arguments;

      return this.append.apply(this, [callee].concat(_toConsumableArray(_arguments)));
    }
  }, {
    key: 'reduceCatchClause',
    value: function reduceCatchClause(node, _ref17) {
      var binding = _ref17.binding,
          body = _ref17.body;

      return this.append(binding, body);
    }
  }, {
    key: 'reduceClassDeclaration',
    value: function reduceClassDeclaration(node, _ref18) {
      var _this5 = this;

      var name = _ref18.name,
          _super = _ref18.super,
          elements = _ref18.elements;

      return this.append.apply(this, [name, _super == null ? function () {
        return _this5.identity;
      } : _super].concat(_toConsumableArray(elements)));
    }
  }, {
    key: 'reduceClassElement',
    value: function reduceClassElement(node, _ref19) {
      var method = _ref19.method;

      return method();
    }
  }, {
    key: 'reduceClassExpression',
    value: function reduceClassExpression(node, _ref20) {
      var _this6 = this;

      var name = _ref20.name,
          _super = _ref20.super,
          elements = _ref20.elements;

      return this.append.apply(this, [name == null ? function () {
        return _this6.identity;
      } : name, _super == null ? function () {
        return _this6.identity;
      } : _super].concat(_toConsumableArray(elements)));
    }
  }, {
    key: 'reduceCompoundAssignmentExpression',
    value: function reduceCompoundAssignmentExpression(node, _ref21) {
      var binding = _ref21.binding,
          expression = _ref21.expression;

      return this.append(binding, expression);
    }
  }, {
    key: 'reduceComputedMemberAssignmentTarget',
    value: function reduceComputedMemberAssignmentTarget(node, _ref22) {
      var object = _ref22.object,
          expression = _ref22.expression;

      return this.append(object, expression);
    }
  }, {
    key: 'reduceComputedMemberExpression',
    value: function reduceComputedMemberExpression(node, _ref23) {
      var object = _ref23.object,
          expression = _ref23.expression;

      return this.append(object, expression);
    }
  }, {
    key: 'reduceComputedPropertyName',
    value: function reduceComputedPropertyName(node, _ref24) {
      var expression = _ref24.expression;

      return expression();
    }
  }, {
    key: 'reduceConditionalExpression',
    value: function reduceConditionalExpression(node, _ref25) {
      var test = _ref25.test,
          consequent = _ref25.consequent,
          alternate = _ref25.alternate;

      return this.append(test, consequent, alternate);
    }
  }, {
    key: 'reduceContinueStatement',
    value: function reduceContinueStatement(node) {
      return this.identity;
    }
  }, {
    key: 'reduceDataProperty',
    value: function reduceDataProperty(node, _ref26) {
      var name = _ref26.name,
          expression = _ref26.expression;

      return this.append(name, expression);
    }
  }, {
    key: 'reduceDebuggerStatement',
    value: function reduceDebuggerStatement(node) {
      return this.identity;
    }
  }, {
    key: 'reduceDirective',
    value: function reduceDirective(node) {
      return this.identity;
    }
  }, {
    key: 'reduceDoWhileStatement',
    value: function reduceDoWhileStatement(node, _ref27) {
      var body = _ref27.body,
          test = _ref27.test;

      return this.append(body, test);
    }
  }, {
    key: 'reduceEmptyStatement',
    value: function reduceEmptyStatement(node) {
      return this.identity;
    }
  }, {
    key: 'reduceExport',
    value: function reduceExport(node, _ref28) {
      var declaration = _ref28.declaration;

      return declaration();
    }
  }, {
    key: 'reduceExportAllFrom',
    value: function reduceExportAllFrom(node) {
      return this.identity;
    }
  }, {
    key: 'reduceExportDefault',
    value: function reduceExportDefault(node, _ref29) {
      var body = _ref29.body;

      return body();
    }
  }, {
    key: 'reduceExportFrom',
    value: function reduceExportFrom(node, _ref30) {
      var namedExports = _ref30.namedExports;

      return this.append.apply(this, _toConsumableArray(namedExports));
    }
  }, {
    key: 'reduceExportFromSpecifier',
    value: function reduceExportFromSpecifier(node) {
      return this.identity;
    }
  }, {
    key: 'reduceExportLocalSpecifier',
    value: function reduceExportLocalSpecifier(node, _ref31) {
      var name = _ref31.name;

      return name();
    }
  }, {
    key: 'reduceExportLocals',
    value: function reduceExportLocals(node, _ref32) {
      var namedExports = _ref32.namedExports;

      return this.append.apply(this, _toConsumableArray(namedExports));
    }
  }, {
    key: 'reduceExpressionStatement',
    value: function reduceExpressionStatement(node, _ref33) {
      var expression = _ref33.expression;

      return expression();
    }
  }, {
    key: 'reduceForAwaitStatement',
    value: function reduceForAwaitStatement(node, _ref34) {
      var left = _ref34.left,
          right = _ref34.right,
          body = _ref34.body;

      return this.append(left, right, body);
    }
  }, {
    key: 'reduceForInStatement',
    value: function reduceForInStatement(node, _ref35) {
      var left = _ref35.left,
          right = _ref35.right,
          body = _ref35.body;

      return this.append(left, right, body);
    }
  }, {
    key: 'reduceForOfStatement',
    value: function reduceForOfStatement(node, _ref36) {
      var left = _ref36.left,
          right = _ref36.right,
          body = _ref36.body;

      return this.append(left, right, body);
    }
  }, {
    key: 'reduceForStatement',
    value: function reduceForStatement(node, _ref37) {
      var _this7 = this;

      var init = _ref37.init,
          test = _ref37.test,
          update = _ref37.update,
          body = _ref37.body;

      return this.append(init == null ? function () {
        return _this7.identity;
      } : init, test == null ? function () {
        return _this7.identity;
      } : test, update == null ? function () {
        return _this7.identity;
      } : update, body);
    }
  }, {
    key: 'reduceFormalParameters',
    value: function reduceFormalParameters(node, _ref38) {
      var _this8 = this;

      var items = _ref38.items,
          rest = _ref38.rest;

      return this.append.apply(this, _toConsumableArray(items).concat([rest == null ? function () {
        return _this8.identity;
      } : rest]));
    }
  }, {
    key: 'reduceFunctionBody',
    value: function reduceFunctionBody(node, _ref39) {
      var directives = _ref39.directives,
          statements = _ref39.statements;

      return this.append.apply(this, _toConsumableArray(directives).concat(_toConsumableArray(statements)));
    }
  }, {
    key: 'reduceFunctionDeclaration',
    value: function reduceFunctionDeclaration(node, _ref40) {
      var name = _ref40.name,
          params = _ref40.params,
          body = _ref40.body;

      return this.append(name, params, body);
    }
  }, {
    key: 'reduceFunctionExpression',
    value: function reduceFunctionExpression(node, _ref41) {
      var _this9 = this;

      var name = _ref41.name,
          params = _ref41.params,
          body = _ref41.body;

      return this.append(name == null ? function () {
        return _this9.identity;
      } : name, params, body);
    }
  }, {
    key: 'reduceGetter',
    value: function reduceGetter(node, _ref42) {
      var name = _ref42.name,
          body = _ref42.body;

      return this.append(name, body);
    }
  }, {
    key: 'reduceIdentifierExpression',
    value: function reduceIdentifierExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceIfStatement',
    value: function reduceIfStatement(node, _ref43) {
      var _this10 = this;

      var test = _ref43.test,
          consequent = _ref43.consequent,
          alternate = _ref43.alternate;

      return this.append(test, consequent, alternate == null ? function () {
        return _this10.identity;
      } : alternate);
    }
  }, {
    key: 'reduceImport',
    value: function reduceImport(node, _ref44) {
      var _this11 = this;

      var defaultBinding = _ref44.defaultBinding,
          namedImports = _ref44.namedImports;

      return this.append.apply(this, [defaultBinding == null ? function () {
        return _this11.identity;
      } : defaultBinding].concat(_toConsumableArray(namedImports)));
    }
  }, {
    key: 'reduceImportNamespace',
    value: function reduceImportNamespace(node, _ref45) {
      var _this12 = this;

      var defaultBinding = _ref45.defaultBinding,
          namespaceBinding = _ref45.namespaceBinding;

      return this.append(defaultBinding == null ? function () {
        return _this12.identity;
      } : defaultBinding, namespaceBinding);
    }
  }, {
    key: 'reduceImportSpecifier',
    value: function reduceImportSpecifier(node, _ref46) {
      var binding = _ref46.binding;

      return binding();
    }
  }, {
    key: 'reduceLabeledStatement',
    value: function reduceLabeledStatement(node, _ref47) {
      var body = _ref47.body;

      return body();
    }
  }, {
    key: 'reduceLiteralBooleanExpression',
    value: function reduceLiteralBooleanExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceLiteralInfinityExpression',
    value: function reduceLiteralInfinityExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceLiteralNullExpression',
    value: function reduceLiteralNullExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceLiteralNumericExpression',
    value: function reduceLiteralNumericExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceLiteralRegExpExpression',
    value: function reduceLiteralRegExpExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceLiteralStringExpression',
    value: function reduceLiteralStringExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceMethod',
    value: function reduceMethod(node, _ref48) {
      var name = _ref48.name,
          params = _ref48.params,
          body = _ref48.body;

      return this.append(name, params, body);
    }
  }, {
    key: 'reduceModule',
    value: function reduceModule(node, _ref49) {
      var directives = _ref49.directives,
          items = _ref49.items;

      return this.append.apply(this, _toConsumableArray(directives).concat(_toConsumableArray(items)));
    }
  }, {
    key: 'reduceNewExpression',
    value: function reduceNewExpression(node, _ref50) {
      var callee = _ref50.callee,
          _arguments = _ref50.arguments;

      return this.append.apply(this, [callee].concat(_toConsumableArray(_arguments)));
    }
  }, {
    key: 'reduceNewTargetExpression',
    value: function reduceNewTargetExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceObjectAssignmentTarget',
    value: function reduceObjectAssignmentTarget(node, _ref51) {
      var _this13 = this;

      var properties = _ref51.properties,
          rest = _ref51.rest;

      return this.append.apply(this, _toConsumableArray(properties).concat([rest == null ? function () {
        return _this13.identity;
      } : rest]));
    }
  }, {
    key: 'reduceObjectBinding',
    value: function reduceObjectBinding(node, _ref52) {
      var _this14 = this;

      var properties = _ref52.properties,
          rest = _ref52.rest;

      return this.append.apply(this, _toConsumableArray(properties).concat([rest == null ? function () {
        return _this14.identity;
      } : rest]));
    }
  }, {
    key: 'reduceObjectExpression',
    value: function reduceObjectExpression(node, _ref53) {
      var properties = _ref53.properties;

      return this.append.apply(this, _toConsumableArray(properties));
    }
  }, {
    key: 'reduceReturnStatement',
    value: function reduceReturnStatement(node, _ref54) {
      var expression = _ref54.expression;

      return expression == null ? this.identity : expression();
    }
  }, {
    key: 'reduceScript',
    value: function reduceScript(node, _ref55) {
      var directives = _ref55.directives,
          statements = _ref55.statements;

      return this.append.apply(this, _toConsumableArray(directives).concat(_toConsumableArray(statements)));
    }
  }, {
    key: 'reduceSetter',
    value: function reduceSetter(node, _ref56) {
      var name = _ref56.name,
          param = _ref56.param,
          body = _ref56.body;

      return this.append(name, param, body);
    }
  }, {
    key: 'reduceShorthandProperty',
    value: function reduceShorthandProperty(node, _ref57) {
      var name = _ref57.name;

      return name();
    }
  }, {
    key: 'reduceSpreadElement',
    value: function reduceSpreadElement(node, _ref58) {
      var expression = _ref58.expression;

      return expression();
    }
  }, {
    key: 'reduceSpreadProperty',
    value: function reduceSpreadProperty(node, _ref59) {
      var expression = _ref59.expression;

      return expression();
    }
  }, {
    key: 'reduceStaticMemberAssignmentTarget',
    value: function reduceStaticMemberAssignmentTarget(node, _ref60) {
      var object = _ref60.object;

      return object();
    }
  }, {
    key: 'reduceStaticMemberExpression',
    value: function reduceStaticMemberExpression(node, _ref61) {
      var object = _ref61.object;

      return object();
    }
  }, {
    key: 'reduceStaticPropertyName',
    value: function reduceStaticPropertyName(node) {
      return this.identity;
    }
  }, {
    key: 'reduceSuper',
    value: function reduceSuper(node) {
      return this.identity;
    }
  }, {
    key: 'reduceSwitchCase',
    value: function reduceSwitchCase(node, _ref62) {
      var test = _ref62.test,
          consequent = _ref62.consequent;

      return this.append.apply(this, [test].concat(_toConsumableArray(consequent)));
    }
  }, {
    key: 'reduceSwitchDefault',
    value: function reduceSwitchDefault(node, _ref63) {
      var consequent = _ref63.consequent;

      return this.append.apply(this, _toConsumableArray(consequent));
    }
  }, {
    key: 'reduceSwitchStatement',
    value: function reduceSwitchStatement(node, _ref64) {
      var discriminant = _ref64.discriminant,
          cases = _ref64.cases;

      return this.append.apply(this, [discriminant].concat(_toConsumableArray(cases)));
    }
  }, {
    key: 'reduceSwitchStatementWithDefault',
    value: function reduceSwitchStatementWithDefault(node, _ref65) {
      var discriminant = _ref65.discriminant,
          preDefaultCases = _ref65.preDefaultCases,
          defaultCase = _ref65.defaultCase,
          postDefaultCases = _ref65.postDefaultCases;

      return this.append.apply(this, [discriminant].concat(_toConsumableArray(preDefaultCases), [defaultCase], _toConsumableArray(postDefaultCases)));
    }
  }, {
    key: 'reduceTemplateElement',
    value: function reduceTemplateElement(node) {
      return this.identity;
    }
  }, {
    key: 'reduceTemplateExpression',
    value: function reduceTemplateExpression(node, _ref66) {
      var _this15 = this;

      var tag = _ref66.tag,
          elements = _ref66.elements;

      return this.append.apply(this, [tag == null ? function () {
        return _this15.identity;
      } : tag].concat(_toConsumableArray(elements)));
    }
  }, {
    key: 'reduceThisExpression',
    value: function reduceThisExpression(node) {
      return this.identity;
    }
  }, {
    key: 'reduceThrowStatement',
    value: function reduceThrowStatement(node, _ref67) {
      var expression = _ref67.expression;

      return expression();
    }
  }, {
    key: 'reduceTryCatchStatement',
    value: function reduceTryCatchStatement(node, _ref68) {
      var body = _ref68.body,
          catchClause = _ref68.catchClause;

      return this.append(body, catchClause);
    }
  }, {
    key: 'reduceTryFinallyStatement',
    value: function reduceTryFinallyStatement(node, _ref69) {
      var _this16 = this;

      var body = _ref69.body,
          catchClause = _ref69.catchClause,
          finalizer = _ref69.finalizer;

      return this.append(body, catchClause == null ? function () {
        return _this16.identity;
      } : catchClause, finalizer);
    }
  }, {
    key: 'reduceUnaryExpression',
    value: function reduceUnaryExpression(node, _ref70) {
      var operand = _ref70.operand;

      return operand();
    }
  }, {
    key: 'reduceUpdateExpression',
    value: function reduceUpdateExpression(node, _ref71) {
      var operand = _ref71.operand;

      return operand();
    }
  }, {
    key: 'reduceVariableDeclaration',
    value: function reduceVariableDeclaration(node, _ref72) {
      var declarators = _ref72.declarators;

      return this.append.apply(this, _toConsumableArray(declarators));
    }
  }, {
    key: 'reduceVariableDeclarationStatement',
    value: function reduceVariableDeclarationStatement(node, _ref73) {
      var declaration = _ref73.declaration;

      return declaration();
    }
  }, {
    key: 'reduceVariableDeclarator',
    value: function reduceVariableDeclarator(node, _ref74) {
      var _this17 = this;

      var binding = _ref74.binding,
          init = _ref74.init;

      return this.append(binding, init == null ? function () {
        return _this17.identity;
      } : init);
    }
  }, {
    key: 'reduceWhileStatement',
    value: function reduceWhileStatement(node, _ref75) {
      var test = _ref75.test,
          body = _ref75.body;

      return this.append(test, body);
    }
  }, {
    key: 'reduceWithStatement',
    value: function reduceWithStatement(node, _ref76) {
      var object = _ref76.object,
          body = _ref76.body;

      return this.append(object, body);
    }
  }, {
    key: 'reduceYieldExpression',
    value: function reduceYieldExpression(node, _ref77) {
      var expression = _ref77.expression;

      return expression == null ? this.identity : expression();
    }
  }, {
    key: 'reduceYieldGeneratorExpression',
    value: function reduceYieldGeneratorExpression(node, _ref78) {
      var expression = _ref78.expression;

      return expression();
    }
  }]);

  return MonoidalReducer;
}();

exports.default = MonoidalReducer;
});

var adapt = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } }; // Generated by generate-adapt.js
/**
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



var Shift = _interopRequireWildcard(dist$2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.default = function (fn, reducer) {
  var _obj;

  return _obj = {
    __proto__: reducer,

    reduceArrayAssignmentTarget: function reduceArrayAssignmentTarget(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceArrayAssignmentTarget', this).call(this, node, data), node);
    },
    reduceArrayBinding: function reduceArrayBinding(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceArrayBinding', this).call(this, node, data), node);
    },
    reduceArrayExpression: function reduceArrayExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceArrayExpression', this).call(this, node, data), node);
    },
    reduceArrowExpression: function reduceArrowExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceArrowExpression', this).call(this, node, data), node);
    },
    reduceAssignmentExpression: function reduceAssignmentExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceAssignmentExpression', this).call(this, node, data), node);
    },
    reduceAssignmentTargetIdentifier: function reduceAssignmentTargetIdentifier(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceAssignmentTargetIdentifier', this).call(this, node, data), node);
    },
    reduceAssignmentTargetPropertyIdentifier: function reduceAssignmentTargetPropertyIdentifier(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceAssignmentTargetPropertyIdentifier', this).call(this, node, data), node);
    },
    reduceAssignmentTargetPropertyProperty: function reduceAssignmentTargetPropertyProperty(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceAssignmentTargetPropertyProperty', this).call(this, node, data), node);
    },
    reduceAssignmentTargetWithDefault: function reduceAssignmentTargetWithDefault(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceAssignmentTargetWithDefault', this).call(this, node, data), node);
    },
    reduceAwaitExpression: function reduceAwaitExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceAwaitExpression', this).call(this, node, data), node);
    },
    reduceBinaryExpression: function reduceBinaryExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceBinaryExpression', this).call(this, node, data), node);
    },
    reduceBindingIdentifier: function reduceBindingIdentifier(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceBindingIdentifier', this).call(this, node, data), node);
    },
    reduceBindingPropertyIdentifier: function reduceBindingPropertyIdentifier(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceBindingPropertyIdentifier', this).call(this, node, data), node);
    },
    reduceBindingPropertyProperty: function reduceBindingPropertyProperty(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceBindingPropertyProperty', this).call(this, node, data), node);
    },
    reduceBindingWithDefault: function reduceBindingWithDefault(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceBindingWithDefault', this).call(this, node, data), node);
    },
    reduceBlock: function reduceBlock(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceBlock', this).call(this, node, data), node);
    },
    reduceBlockStatement: function reduceBlockStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceBlockStatement', this).call(this, node, data), node);
    },
    reduceBreakStatement: function reduceBreakStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceBreakStatement', this).call(this, node, data), node);
    },
    reduceCallExpression: function reduceCallExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceCallExpression', this).call(this, node, data), node);
    },
    reduceCatchClause: function reduceCatchClause(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceCatchClause', this).call(this, node, data), node);
    },
    reduceClassDeclaration: function reduceClassDeclaration(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceClassDeclaration', this).call(this, node, data), node);
    },
    reduceClassElement: function reduceClassElement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceClassElement', this).call(this, node, data), node);
    },
    reduceClassExpression: function reduceClassExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceClassExpression', this).call(this, node, data), node);
    },
    reduceCompoundAssignmentExpression: function reduceCompoundAssignmentExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceCompoundAssignmentExpression', this).call(this, node, data), node);
    },
    reduceComputedMemberAssignmentTarget: function reduceComputedMemberAssignmentTarget(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceComputedMemberAssignmentTarget', this).call(this, node, data), node);
    },
    reduceComputedMemberExpression: function reduceComputedMemberExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceComputedMemberExpression', this).call(this, node, data), node);
    },
    reduceComputedPropertyName: function reduceComputedPropertyName(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceComputedPropertyName', this).call(this, node, data), node);
    },
    reduceConditionalExpression: function reduceConditionalExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceConditionalExpression', this).call(this, node, data), node);
    },
    reduceContinueStatement: function reduceContinueStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceContinueStatement', this).call(this, node, data), node);
    },
    reduceDataProperty: function reduceDataProperty(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceDataProperty', this).call(this, node, data), node);
    },
    reduceDebuggerStatement: function reduceDebuggerStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceDebuggerStatement', this).call(this, node, data), node);
    },
    reduceDirective: function reduceDirective(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceDirective', this).call(this, node, data), node);
    },
    reduceDoWhileStatement: function reduceDoWhileStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceDoWhileStatement', this).call(this, node, data), node);
    },
    reduceEmptyStatement: function reduceEmptyStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceEmptyStatement', this).call(this, node, data), node);
    },
    reduceExport: function reduceExport(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceExport', this).call(this, node, data), node);
    },
    reduceExportAllFrom: function reduceExportAllFrom(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceExportAllFrom', this).call(this, node, data), node);
    },
    reduceExportDefault: function reduceExportDefault(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceExportDefault', this).call(this, node, data), node);
    },
    reduceExportFrom: function reduceExportFrom(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceExportFrom', this).call(this, node, data), node);
    },
    reduceExportFromSpecifier: function reduceExportFromSpecifier(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceExportFromSpecifier', this).call(this, node, data), node);
    },
    reduceExportLocalSpecifier: function reduceExportLocalSpecifier(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceExportLocalSpecifier', this).call(this, node, data), node);
    },
    reduceExportLocals: function reduceExportLocals(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceExportLocals', this).call(this, node, data), node);
    },
    reduceExpressionStatement: function reduceExpressionStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceExpressionStatement', this).call(this, node, data), node);
    },
    reduceForAwaitStatement: function reduceForAwaitStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceForAwaitStatement', this).call(this, node, data), node);
    },
    reduceForInStatement: function reduceForInStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceForInStatement', this).call(this, node, data), node);
    },
    reduceForOfStatement: function reduceForOfStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceForOfStatement', this).call(this, node, data), node);
    },
    reduceForStatement: function reduceForStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceForStatement', this).call(this, node, data), node);
    },
    reduceFormalParameters: function reduceFormalParameters(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceFormalParameters', this).call(this, node, data), node);
    },
    reduceFunctionBody: function reduceFunctionBody(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceFunctionBody', this).call(this, node, data), node);
    },
    reduceFunctionDeclaration: function reduceFunctionDeclaration(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceFunctionDeclaration', this).call(this, node, data), node);
    },
    reduceFunctionExpression: function reduceFunctionExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceFunctionExpression', this).call(this, node, data), node);
    },
    reduceGetter: function reduceGetter(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceGetter', this).call(this, node, data), node);
    },
    reduceIdentifierExpression: function reduceIdentifierExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceIdentifierExpression', this).call(this, node, data), node);
    },
    reduceIfStatement: function reduceIfStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceIfStatement', this).call(this, node, data), node);
    },
    reduceImport: function reduceImport(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceImport', this).call(this, node, data), node);
    },
    reduceImportNamespace: function reduceImportNamespace(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceImportNamespace', this).call(this, node, data), node);
    },
    reduceImportSpecifier: function reduceImportSpecifier(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceImportSpecifier', this).call(this, node, data), node);
    },
    reduceLabeledStatement: function reduceLabeledStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceLabeledStatement', this).call(this, node, data), node);
    },
    reduceLiteralBooleanExpression: function reduceLiteralBooleanExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceLiteralBooleanExpression', this).call(this, node, data), node);
    },
    reduceLiteralInfinityExpression: function reduceLiteralInfinityExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceLiteralInfinityExpression', this).call(this, node, data), node);
    },
    reduceLiteralNullExpression: function reduceLiteralNullExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceLiteralNullExpression', this).call(this, node, data), node);
    },
    reduceLiteralNumericExpression: function reduceLiteralNumericExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceLiteralNumericExpression', this).call(this, node, data), node);
    },
    reduceLiteralRegExpExpression: function reduceLiteralRegExpExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceLiteralRegExpExpression', this).call(this, node, data), node);
    },
    reduceLiteralStringExpression: function reduceLiteralStringExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceLiteralStringExpression', this).call(this, node, data), node);
    },
    reduceMethod: function reduceMethod(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceMethod', this).call(this, node, data), node);
    },
    reduceModule: function reduceModule(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceModule', this).call(this, node, data), node);
    },
    reduceNewExpression: function reduceNewExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceNewExpression', this).call(this, node, data), node);
    },
    reduceNewTargetExpression: function reduceNewTargetExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceNewTargetExpression', this).call(this, node, data), node);
    },
    reduceObjectAssignmentTarget: function reduceObjectAssignmentTarget(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceObjectAssignmentTarget', this).call(this, node, data), node);
    },
    reduceObjectBinding: function reduceObjectBinding(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceObjectBinding', this).call(this, node, data), node);
    },
    reduceObjectExpression: function reduceObjectExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceObjectExpression', this).call(this, node, data), node);
    },
    reduceReturnStatement: function reduceReturnStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceReturnStatement', this).call(this, node, data), node);
    },
    reduceScript: function reduceScript(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceScript', this).call(this, node, data), node);
    },
    reduceSetter: function reduceSetter(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceSetter', this).call(this, node, data), node);
    },
    reduceShorthandProperty: function reduceShorthandProperty(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceShorthandProperty', this).call(this, node, data), node);
    },
    reduceSpreadElement: function reduceSpreadElement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceSpreadElement', this).call(this, node, data), node);
    },
    reduceSpreadProperty: function reduceSpreadProperty(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceSpreadProperty', this).call(this, node, data), node);
    },
    reduceStaticMemberAssignmentTarget: function reduceStaticMemberAssignmentTarget(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceStaticMemberAssignmentTarget', this).call(this, node, data), node);
    },
    reduceStaticMemberExpression: function reduceStaticMemberExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceStaticMemberExpression', this).call(this, node, data), node);
    },
    reduceStaticPropertyName: function reduceStaticPropertyName(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceStaticPropertyName', this).call(this, node, data), node);
    },
    reduceSuper: function reduceSuper(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceSuper', this).call(this, node, data), node);
    },
    reduceSwitchCase: function reduceSwitchCase(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceSwitchCase', this).call(this, node, data), node);
    },
    reduceSwitchDefault: function reduceSwitchDefault(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceSwitchDefault', this).call(this, node, data), node);
    },
    reduceSwitchStatement: function reduceSwitchStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceSwitchStatement', this).call(this, node, data), node);
    },
    reduceSwitchStatementWithDefault: function reduceSwitchStatementWithDefault(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceSwitchStatementWithDefault', this).call(this, node, data), node);
    },
    reduceTemplateElement: function reduceTemplateElement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceTemplateElement', this).call(this, node, data), node);
    },
    reduceTemplateExpression: function reduceTemplateExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceTemplateExpression', this).call(this, node, data), node);
    },
    reduceThisExpression: function reduceThisExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceThisExpression', this).call(this, node, data), node);
    },
    reduceThrowStatement: function reduceThrowStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceThrowStatement', this).call(this, node, data), node);
    },
    reduceTryCatchStatement: function reduceTryCatchStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceTryCatchStatement', this).call(this, node, data), node);
    },
    reduceTryFinallyStatement: function reduceTryFinallyStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceTryFinallyStatement', this).call(this, node, data), node);
    },
    reduceUnaryExpression: function reduceUnaryExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceUnaryExpression', this).call(this, node, data), node);
    },
    reduceUpdateExpression: function reduceUpdateExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceUpdateExpression', this).call(this, node, data), node);
    },
    reduceVariableDeclaration: function reduceVariableDeclaration(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceVariableDeclaration', this).call(this, node, data), node);
    },
    reduceVariableDeclarationStatement: function reduceVariableDeclarationStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceVariableDeclarationStatement', this).call(this, node, data), node);
    },
    reduceVariableDeclarator: function reduceVariableDeclarator(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceVariableDeclarator', this).call(this, node, data), node);
    },
    reduceWhileStatement: function reduceWhileStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceWhileStatement', this).call(this, node, data), node);
    },
    reduceWithStatement: function reduceWithStatement(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceWithStatement', this).call(this, node, data), node);
    },
    reduceYieldExpression: function reduceYieldExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceYieldExpression', this).call(this, node, data), node);
    },
    reduceYieldGeneratorExpression: function reduceYieldGeneratorExpression(node, data) {
      return fn(_get(_obj.__proto__ || Object.getPrototypeOf(_obj), 'reduceYieldGeneratorExpression', this).call(this, node, data), node);
    }
  };
};
});

var reducers = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ThunkedOrReducer = exports.OrReducer = exports.ThunkedAndReducer = exports.AndReducer = exports.ThunkedConcatReducer = exports.ConcatReducer = exports.ThunkedPlusReducer = exports.PlusReducer = undefined;



var _monoidalReducer2 = _interopRequireDefault(monoidalReducer);



var _thunkedMonoidalReducer2 = _interopRequireDefault(thunkedMonoidalReducer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PlusMonoid = {
  empty: function empty() {
    return 0;
  },
  concat: function concat(a, b) {
    return a + b;
  }
};

var ConcatMonoid = {
  empty: function empty() {
    return [];
  },
  concat: function concat(a, b) {
    return a.concat(b);
  }
};

var AndMonoid = {
  empty: function empty() {
    return true;
  },
  concat: function concat(a, b) {
    return a && b;
  },
  concatThunk: function concatThunk(a, b) {
    return a && b();
  }
};

var OrMonoid = {
  empty: function empty() {
    return false;
  },
  concat: function concat(a, b) {
    return a || b;
  },
  concatThunk: function concatThunk(a, b) {
    return a || b();
  }
};

var PlusReducer = exports.PlusReducer = function (_MonoidalReducer) {
  _inherits(PlusReducer, _MonoidalReducer);

  function PlusReducer() {
    _classCallCheck(this, PlusReducer);

    return _possibleConstructorReturn(this, (PlusReducer.__proto__ || Object.getPrototypeOf(PlusReducer)).call(this, PlusMonoid));
  }

  return PlusReducer;
}(_monoidalReducer2.default);

var ThunkedPlusReducer = exports.ThunkedPlusReducer = function (_ThunkedMonoidalReduc) {
  _inherits(ThunkedPlusReducer, _ThunkedMonoidalReduc);

  function ThunkedPlusReducer() {
    _classCallCheck(this, ThunkedPlusReducer);

    return _possibleConstructorReturn(this, (ThunkedPlusReducer.__proto__ || Object.getPrototypeOf(ThunkedPlusReducer)).call(this, PlusMonoid));
  }

  return ThunkedPlusReducer;
}(_thunkedMonoidalReducer2.default);

var ConcatReducer = exports.ConcatReducer = function (_MonoidalReducer2) {
  _inherits(ConcatReducer, _MonoidalReducer2);

  function ConcatReducer() {
    _classCallCheck(this, ConcatReducer);

    return _possibleConstructorReturn(this, (ConcatReducer.__proto__ || Object.getPrototypeOf(ConcatReducer)).call(this, ConcatMonoid));
  }

  return ConcatReducer;
}(_monoidalReducer2.default);

var ThunkedConcatReducer = exports.ThunkedConcatReducer = function (_ThunkedMonoidalReduc2) {
  _inherits(ThunkedConcatReducer, _ThunkedMonoidalReduc2);

  function ThunkedConcatReducer() {
    _classCallCheck(this, ThunkedConcatReducer);

    return _possibleConstructorReturn(this, (ThunkedConcatReducer.__proto__ || Object.getPrototypeOf(ThunkedConcatReducer)).call(this, ConcatMonoid));
  }

  return ThunkedConcatReducer;
}(_thunkedMonoidalReducer2.default);

var AndReducer = exports.AndReducer = function (_MonoidalReducer3) {
  _inherits(AndReducer, _MonoidalReducer3);

  function AndReducer() {
    _classCallCheck(this, AndReducer);

    return _possibleConstructorReturn(this, (AndReducer.__proto__ || Object.getPrototypeOf(AndReducer)).call(this, AndMonoid));
  }

  return AndReducer;
}(_monoidalReducer2.default);

var ThunkedAndReducer = exports.ThunkedAndReducer = function (_ThunkedMonoidalReduc3) {
  _inherits(ThunkedAndReducer, _ThunkedMonoidalReduc3);

  function ThunkedAndReducer() {
    _classCallCheck(this, ThunkedAndReducer);

    return _possibleConstructorReturn(this, (ThunkedAndReducer.__proto__ || Object.getPrototypeOf(ThunkedAndReducer)).call(this, AndMonoid));
  }

  return ThunkedAndReducer;
}(_thunkedMonoidalReducer2.default);

var OrReducer = exports.OrReducer = function (_MonoidalReducer4) {
  _inherits(OrReducer, _MonoidalReducer4);

  function OrReducer() {
    _classCallCheck(this, OrReducer);

    return _possibleConstructorReturn(this, (OrReducer.__proto__ || Object.getPrototypeOf(OrReducer)).call(this, OrMonoid));
  }

  return OrReducer;
}(_monoidalReducer2.default);

var ThunkedOrReducer = exports.ThunkedOrReducer = function (_ThunkedMonoidalReduc4) {
  _inherits(ThunkedOrReducer, _ThunkedMonoidalReduc4);

  function ThunkedOrReducer() {
    _classCallCheck(this, ThunkedOrReducer);

    return _possibleConstructorReturn(this, (ThunkedOrReducer.__proto__ || Object.getPrototypeOf(ThunkedOrReducer)).call(this, OrMonoid));
  }

  return ThunkedOrReducer;
}(_thunkedMonoidalReducer2.default);
});

var dist = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});



Object.defineProperty(exports, 'reduce', {
  enumerable: true,
  get: function get() {
    return director_1.reduce;
  }
});
Object.defineProperty(exports, 'default', {
  enumerable: true,
  get: function get() {
    return director_1.reduce;
  }
});



Object.defineProperty(exports, 'thunkedReduce', {
  enumerable: true,
  get: function get() {
    return thunkedDirector.thunkedReduce;
  }
});



Object.defineProperty(exports, 'thunkify', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(thunkify_1).default;
  }
});



Object.defineProperty(exports, 'thunkifyClass', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(thunkifyClass_1).default;
  }
});



Object.defineProperty(exports, 'memoize', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(memoize_1).default;
  }
});



Object.defineProperty(exports, 'CloneReducer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(cloneReducer).default;
  }
});



Object.defineProperty(exports, 'LazyCloneReducer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(lazyCloneReducer).default;
  }
});



Object.defineProperty(exports, 'MonoidalReducer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(monoidalReducer).default;
  }
});



Object.defineProperty(exports, 'ThunkedMonoidalReducer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(thunkedMonoidalReducer).default;
  }
});



Object.defineProperty(exports, 'adapt', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(adapt).default;
  }
});



Object.defineProperty(exports, 'PlusReducer', {
  enumerable: true,
  get: function get() {
    return reducers.PlusReducer;
  }
});
Object.defineProperty(exports, 'ThunkedPlusReducer', {
  enumerable: true,
  get: function get() {
    return reducers.ThunkedPlusReducer;
  }
});
Object.defineProperty(exports, 'ConcatReducer', {
  enumerable: true,
  get: function get() {
    return reducers.ConcatReducer;
  }
});
Object.defineProperty(exports, 'ThunkedConcatReducer', {
  enumerable: true,
  get: function get() {
    return reducers.ThunkedConcatReducer;
  }
});
Object.defineProperty(exports, 'AndReducer', {
  enumerable: true,
  get: function get() {
    return reducers.AndReducer;
  }
});
Object.defineProperty(exports, 'ThunkedAndReducer', {
  enumerable: true,
  get: function get() {
    return reducers.ThunkedAndReducer;
  }
});
Object.defineProperty(exports, 'OrReducer', {
  enumerable: true,
  get: function get() {
    return reducers.OrReducer;
  }
});
Object.defineProperty(exports, 'ThunkedOrReducer', {
  enumerable: true,
  get: function get() {
    return reducers.ThunkedOrReducer;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
});

var unicode = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Generated by scripts/generate-unicode-data.js

var whitespaceArray = exports.whitespaceArray = [5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8239, 8287, 12288, 65279];
var whitespaceBool = exports.whitespaceBool = [false, false, false, false, false, false, false, false, false, true, false, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];

var idStartLargeRegex = exports.idStartLargeRegex = /^[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]$/;
var idStartBool = exports.idStartBool = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false];

var idContinueLargeRegex = exports.idContinueLargeRegex = /^[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]$/;
var idContinueBool = exports.idContinueBool = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false];
});

var tokenStream = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TokenStream = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright 2014 Shape Security, Inc.
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

exports.needsDoubleDot = needsDoubleDot;



function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function isIdentifierPartES6(char) {
  var charCode = char.charCodeAt(0);
  if (charCode < 128) {
    return unicode.idContinueBool[charCode];
  }
  return unicode.idContinueLargeRegex.test(char);
}

function needsDoubleDot(fragment) {
  return fragment.indexOf('.') < 0 && fragment.indexOf('e') < 0 && fragment.indexOf('x') < 0;
}

function renderNumber(n) {
  var s = void 0;
  if (n >= 1e3 && n % 10 === 0) {
    s = n.toString(10);
    if (/[eE]/.test(s)) {
      return s.replace(/[eE]\+/, 'e');
    }
    return n.toString(10).replace(/0{3,}$/, function (match) {
      return 'e' + match.length;
    });
  } else if (n % 1 === 0) {
    if (n > 1e15 && n < 1e20) {
      return '0x' + n.toString(16).toUpperCase();
    }
    return n.toString(10).replace(/[eE]\+/, 'e');
  }
  return n.toString(10).replace(/^0\./, '.').replace(/[eE]\+/, 'e');
}

var TokenStream = exports.TokenStream = function () {
  function TokenStream() {
    _classCallCheck(this, TokenStream);

    this.result = '';
    this.lastNumber = null;
    this.lastCodePoint = null;
    this.lastTokenStr = '';
    this.optionalSemi = false;
    this.previousWasRegExp = false;
    this.partialHtmlComment = false;
  }

  _createClass(TokenStream, [{
    key: 'putNumber',
    value: function putNumber(number) {
      var tokenStr = renderNumber(number);
      this.put(tokenStr);
      this.lastNumber = tokenStr;
    }
  }, {
    key: 'putOptionalSemi',
    value: function putOptionalSemi() {
      this.optionalSemi = true;
    }
  }, {
    key: 'putRaw',
    value: function putRaw(tokenStr) {
      this.result += tokenStr;
      this.lastTokenStr = tokenStr;
    }
  }, {
    key: 'put',
    value: function put(tokenStr, isRegExp) {
      if (this.optionalSemi) {
        this.optionalSemi = false;
        if (tokenStr !== '}') {
          this.result += ';';
          this.lastCodePoint = ';';
          this.previousWasRegExp = false;
        }
      }
      if (this.lastNumber !== null && tokenStr.length === 1) {
        if (tokenStr === '.') {
          this.result += needsDoubleDot(this.lastNumber) ? '..' : '.';
          this.lastNumber = null;
          this.lastCodePoint = '.';
          return;
        }
      }
      var tokenStrCodePointCount = [].concat(_toConsumableArray(tokenStr)).length; // slow, no unicode length?
      if (tokenStrCodePointCount > 0) {
        this.lastNumber = null;
        var rightCodePoint = String.fromCodePoint(tokenStr.codePointAt(0));
        var lastCodePoint = this.lastCodePoint;
        this.lastCodePoint = String.fromCodePoint(tokenStr.codePointAt(tokenStrCodePointCount - 1));
        var previousWasRegExp = this.previousWasRegExp;
        this.previousWasRegExp = isRegExp;

        if (lastCodePoint && ((lastCodePoint === '+' || lastCodePoint === '-') && lastCodePoint === rightCodePoint || isIdentifierPartES6(lastCodePoint) && isIdentifierPartES6(rightCodePoint) || lastCodePoint === '/' && rightCodePoint === '/' || previousWasRegExp && rightCodePoint === 'i' || this.partialHtmlComment && tokenStr.startsWith('--'))) {
          this.result += ' ';
        }
      }

      this.partialHtmlComment = this.lastTokenStr.endsWith('<') && tokenStr === '!';

      this.result += tokenStr;
      this.lastTokenStr = tokenStr;
    }
  }]);

  return TokenStream;
}();
});

var withLocation = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.default = codeGenWithLocation;







var _minimalCodegen2 = _interopRequireDefault(minimalCodegen);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function mightHaveSemi(type) {
  return (/(Import)|(Export)|(Statement)|(Directive)|(SwitchCase)|(SwitchDefault)/.test(type)
  );
}

var TokenStreamWithLocation = function (_TokenStream) {
  _inherits(TokenStreamWithLocation, _TokenStream);

  function TokenStreamWithLocation() {
    _classCallCheck(this, TokenStreamWithLocation);

    var _this = _possibleConstructorReturn(this, (TokenStreamWithLocation.__proto__ || Object.getPrototypeOf(TokenStreamWithLocation)).call(this));

    _this.line = 1;
    _this.column = 0;
    _this.startingNodes = [];
    _this.finishingStatements = [];
    _this.lastNumberNode = null;
    _this.locations = new WeakMap();
    return _this;
  }

  _createClass(TokenStreamWithLocation, [{
    key: 'putRaw',
    value: function putRaw(tokenStr) {
      var previousLength = this.result.length;
      _get(TokenStreamWithLocation.prototype.__proto__ || Object.getPrototypeOf(TokenStreamWithLocation.prototype), 'putRaw', this).call(this, tokenStr);
      this.startNodes(tokenStr, previousLength);
    }
  }, {
    key: 'put',
    value: function put(tokenStr, isRegExp) {
      if (this.optionalSemi && tokenStr !== '}') {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = this.finishingStatements[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var obj = _step.value;

            ++obj.end.column;
            ++obj.end.offset;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
      this.finishingStatements = [];

      if (this.lastNumber !== null && tokenStr === '.' && (0, tokenStream.needsDoubleDot)(this.lastNumber)) {
        var loc = this.locations.get(this.lastNumberNode).end;
        ++loc.column;
        ++loc.offset;
      }
      this.lastNumberNode = null;

      var previousLength = this.result.length;
      _get(TokenStreamWithLocation.prototype.__proto__ || Object.getPrototypeOf(TokenStreamWithLocation.prototype), 'put', this).call(this, tokenStr, isRegExp);
      this.startNodes(tokenStr, previousLength);
    }
  }, {
    key: 'startNodes',
    value: function startNodes(tokenStr, previousLength) {
      var linebreakRegex = /\r\n?|[\n\u2028\u2029]/g;
      var matched = false;
      var match = void 0;
      var startLine = this.line;
      var startColumn = this.column;
      while (match = linebreakRegex.exec(tokenStr)) {
        ++this.line;
        this.column = tokenStr.length - match.index - match[0].length;
        matched = true;
      }

      if (!matched) {
        this.column += this.result.length - previousLength;
        startColumn = this.column - tokenStr.length; // i.e., skip past any additional characters which were necessitated by, but not part of, this part
      }
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.startingNodes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var node = _step2.value;

          this.locations.set(node, {
            start: {
              line: startLine,
              column: startColumn,
              offset: this.result.length - tokenStr.length
            },
            end: null
          });
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      this.startingNodes = [];
    }
  }, {
    key: 'startEmit',
    value: function startEmit(node) {
      this.startingNodes.push(node);
    }
  }, {
    key: 'finishEmit',
    value: function finishEmit(node) {
      this.locations.get(node).end = {
        line: this.line,
        column: this.column,
        offset: this.result.length
      };
      if (mightHaveSemi(node.type)) {
        this.finishingStatements.push(this.locations.get(node));
      }
    }
  }]);

  return TokenStreamWithLocation;
}(tokenStream.TokenStream);

function addLocation(rep, node) {
  var originalEmit = rep.emit.bind(rep);
  if (node.type === 'Script' || node.type === 'Module') {
    // These are handled specially: they include beginning and trailing whitespace.
    rep.emit = function (ts) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      ts.locations.set(node, {
        start: {
          line: 1,
          column: 0,
          offset: 0
        },
        end: null
      });
      originalEmit.apply(undefined, [ts].concat(args));
      ts.locations.get(node).end = {
        line: ts.line,
        column: ts.column,
        offset: ts.result.length
      };
    };
  } else if (node.type === 'LiteralNumericExpression') {
    rep.emit = function (ts) {
      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      ts.startEmit(node);
      originalEmit.apply(undefined, [ts].concat(args));
      ts.finishEmit(node);
      ts.lastNumberNode = node;
    };
  } else {
    rep.emit = function (ts) {
      for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }

      ts.startEmit(node);
      originalEmit.apply(undefined, [ts].concat(args));
      ts.finishEmit(node);
    };
  }
  return rep;
}

function addLocationToReducer(reducer) {
  var wrapped = (0, dist.adapt)(addLocation, reducer);

  var originalRegenerate = wrapped.regenerateArrowParams.bind(wrapped);
  wrapped.regenerateArrowParams = function (element, original) {
    var out = originalRegenerate(element, original);
    if (out !== original) {
      addLocation(out, element);
    }
    return out;
  };

  var originalDirective = wrapped.parenToAvoidBeingDirective.bind(wrapped);
  wrapped.parenToAvoidBeingDirective = function (element, original) {
    var out = originalDirective(element, original);
    if (out !== original) {
      addLocation(out, element);
    }
    return out;
  };

  return wrapped;
}

function codeGenWithLocation(program) {
  var generator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new _minimalCodegen2.default();

  var ts = new TokenStreamWithLocation();
  var rep = (0, dist.reduce)(addLocationToReducer(generator), program);
  rep.emit(ts);
  return { source: ts.result, locations: ts.locations };
}
});

var dist$1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.codeGenWithLocation = exports.SemiOp = exports.CommaSep = exports.Semi = exports.Seq = exports.ContainsIn = exports.NoIn = exports.Brace = exports.Bracket = exports.Paren = exports.NumberCodeRep = exports.Token = exports.Empty = exports.CodeRep = exports.escapeStringLiteral = exports.getPrecedence = exports.Precedence = exports.Sep = exports.FormattedCodeGen = exports.ExtensibleCodeGen = exports.MinimalCodeGen = undefined;
exports.default = codeGen;



Object.defineProperty(exports, 'MinimalCodeGen', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(minimalCodegen).default;
  }
});



Object.defineProperty(exports, 'ExtensibleCodeGen', {
  enumerable: true,
  get: function get() {
    return formattedCodegen.ExtensibleCodeGen;
  }
});
Object.defineProperty(exports, 'FormattedCodeGen', {
  enumerable: true,
  get: function get() {
    return formattedCodegen.FormattedCodeGen;
  }
});
Object.defineProperty(exports, 'Sep', {
  enumerable: true,
  get: function get() {
    return formattedCodegen.Sep;
  }
});



Object.defineProperty(exports, 'Precedence', {
  enumerable: true,
  get: function get() {
    return coderep.Precedence;
  }
});
Object.defineProperty(exports, 'getPrecedence', {
  enumerable: true,
  get: function get() {
    return coderep.getPrecedence;
  }
});
Object.defineProperty(exports, 'escapeStringLiteral', {
  enumerable: true,
  get: function get() {
    return coderep.escapeStringLiteral;
  }
});
Object.defineProperty(exports, 'CodeRep', {
  enumerable: true,
  get: function get() {
    return coderep.CodeRep;
  }
});
Object.defineProperty(exports, 'Empty', {
  enumerable: true,
  get: function get() {
    return coderep.Empty;
  }
});
Object.defineProperty(exports, 'Token', {
  enumerable: true,
  get: function get() {
    return coderep.Token;
  }
});
Object.defineProperty(exports, 'NumberCodeRep', {
  enumerable: true,
  get: function get() {
    return coderep.NumberCodeRep;
  }
});
Object.defineProperty(exports, 'Paren', {
  enumerable: true,
  get: function get() {
    return coderep.Paren;
  }
});
Object.defineProperty(exports, 'Bracket', {
  enumerable: true,
  get: function get() {
    return coderep.Bracket;
  }
});
Object.defineProperty(exports, 'Brace', {
  enumerable: true,
  get: function get() {
    return coderep.Brace;
  }
});
Object.defineProperty(exports, 'NoIn', {
  enumerable: true,
  get: function get() {
    return coderep.NoIn;
  }
});
Object.defineProperty(exports, 'ContainsIn', {
  enumerable: true,
  get: function get() {
    return coderep.ContainsIn;
  }
});
Object.defineProperty(exports, 'Seq', {
  enumerable: true,
  get: function get() {
    return coderep.Seq;
  }
});
Object.defineProperty(exports, 'Semi', {
  enumerable: true,
  get: function get() {
    return coderep.Semi;
  }
});
Object.defineProperty(exports, 'CommaSep', {
  enumerable: true,
  get: function get() {
    return coderep.CommaSep;
  }
});
Object.defineProperty(exports, 'SemiOp', {
  enumerable: true,
  get: function get() {
    return coderep.SemiOp;
  }
});



Object.defineProperty(exports, 'codeGenWithLocation', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(withLocation).default;
  }
});



var _shiftReducer2 = _interopRequireDefault(dist);



var _minimalCodegen2 = _interopRequireDefault(minimalCodegen);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function codeGen(script) {
  var generator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new _minimalCodegen2.default();

  var ts = new tokenStream.TokenStream();
  var rep = (0, _shiftReducer2.default)(generator, script);
  rep.emit(ts);
  return ts.result;
}
});

var __pika_web_default_export_for_treeshaking__ = /*@__PURE__*/getDefaultExportFromCjs(dist$1);

export default __pika_web_default_export_for_treeshaking__;
