async function run() {
  let res = await fetch('./add.wasm');
  res = await res.arrayBuffer();
  res = await WebAssembly.instantiate(res, {
    env: {},
  });
  const { add } = res.instance.exports;
  console.log(add(3, 5));
}

run();
