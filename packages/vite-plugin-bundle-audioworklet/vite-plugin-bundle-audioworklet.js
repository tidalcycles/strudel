import { createLogger, build } from 'vite';

const end = '?audioworklet';

function bundleAudioWorkletPlugin() /* : PluginOption */ {
  let viteConfig /* : UserConfig */;

  return {
    name: 'vite-plugin-bundle-audioworklet',
    /* apply: 'build', */
    enforce: 'post',

    config(config) {
      viteConfig = config;
    },

    async transform(_code, id) {
      if (!id.endsWith(end)) {
        return;
      }
      const entry = id.replace(end, '');
      const quietLogger = createLogger();
      quietLogger.info = () => undefined;

      const output = await build({
        configFile: false,
        clearScreen: false,
        customLogger: quietLogger,
        build: {
          lib: {
            entry,
            name: '_',
            formats: ['iife'],
          },
          write: false,
        },
      });
      if (!(output instanceof Array)) {
        throw new Error('Expected output to be Array');
      }
      const iife = output[0].output[0].code;
      const encoded = Buffer.from(iife, 'utf8').toString('base64');
      return `export default "data:text/javascript;base64,${encoded}";`;
    },
  };
}

export default bundleAudioWorkletPlugin;
