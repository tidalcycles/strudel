// this is a shortcut to eval code from a gist
// why? to be able to shorten strudel code + e.g. be able to change instruments after links have been generated
export default (route) =>
  fetch(`https://gist.githubusercontent.com/${route}?cachebust=${Date.now()}`)
    .then((res) => res.text())
    .then((code) => eval(code));
