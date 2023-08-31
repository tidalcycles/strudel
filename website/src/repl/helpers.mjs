export function unicodeToBase64(text) {
  const utf8Bytes = new TextEncoder().encode(text);
  const base64String = btoa(String.fromCharCode(...utf8Bytes));
  return base64String;
}

export function base64ToUnicode(base64String) {
  const utf8Bytes = new Uint8Array(
    atob(base64String)
      .split('')
      .map((char) => char.charCodeAt(0)),
  );
  const decodedText = new TextDecoder().decode(utf8Bytes);
  return decodedText;
}

export function code2hash(code) {
  return encodeURIComponent(unicodeToBase64(code));
  //return '#' + encodeURIComponent(btoa(code));
}

export function hash2code(hash) {
  return base64ToUnicode(decodeURIComponent(hash));
  //return atob(decodeURIComponent(codeParam || ''));
}
