import * as Tone from "../_snowpack/pkg/tone.js";
export const hideHeader = () => {
  document.getElementById("header").style = "display:none";
};
function frame(callback) {
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  const animate = (animationTime) => {
    const toneTime = Tone.getTransport().seconds;
    callback(animationTime, toneTime);
    window.strudelAnimation = requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}
export const backgroundImage = function(src, animateOptions = {}) {
  const container = document.getElementById("code");
  const bg = "background-image:url(" + src + ");background-size:contain;";
  container.style = bg;
  const {className: initialClassName} = container;
  const handleOption = (option, value) => {
    ({
      style: () => container.style = bg + ";" + value,
      className: () => container.className = value + " " + initialClassName
    })[option]();
  };
  const funcOptions = Object.entries(animateOptions).filter(([_, v]) => typeof v === "function");
  const stringOptions = Object.entries(animateOptions).filter(([_, v]) => typeof v === "string");
  stringOptions.forEach(([option, value]) => handleOption(option, value));
  if (funcOptions.length === 0) {
    return;
  }
  frame((_, t) => funcOptions.forEach(([option, value]) => {
    handleOption(option, value(t));
  }));
};
export const cleanup = () => {
  const container = document.getElementById("code");
  if (container) {
    container.style = "";
    container.className = "grow relative";
  }
};
