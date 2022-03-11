import * as Tone from "../_snowpack/pkg/tone.js";
export const getDrawContext = (id = "test-canvas") => {
  let canvas = document.querySelector("#" + id);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style = "pointer-events:none;width:100%;height:100%;position:fixed;top:0;left:0";
    document.body.prepend(canvas);
  }
  return canvas.getContext("2d");
};
export const draw = (callback) => {
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  const animate = (t) => {
    callback(t);
    window.strudelAnimation = requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
};
export const queryEvents = (pattern, callback, seconds) => {
  const queryEvents2 = () => {
    const t = Tone.getTransport().seconds;
    const begin = Math.floor(t / seconds) * seconds;
    const end = begin + seconds * 4;
    const events = pattern.add(0).query(new State(new TimeSpan(begin, end)));
    callback(events);
  };
  queryEvents2();
  if (window.strudelScheduler) {
    clearInterval(window.strudelScheduler);
  }
  window.strudelScheduler = setInterval(() => {
    queryEvents2();
  }, seconds * 1.5 * 1e3);
};
export const cleanup = () => {
  const ctx = getDrawContext();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  if (window.strudelScheduler) {
    clearInterval(window.strudelScheduler);
  }
};
