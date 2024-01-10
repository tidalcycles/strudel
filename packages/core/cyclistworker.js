const ports = [];

self.onconnect = function (ev) {
  let port = ev.ports[0];
  port.onmessage = (e) => {
    setTimeout(() => {
      ports.forEach((p) => p.postMessage([e.data, ev.ports.length]));
    }, 300);
  };
  port.start();
  ports.push(port);
};
self.onmessage = ({ data: { question } }) => {
  self.postMessage({
    answer: 42,
  });
};
