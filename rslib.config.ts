export default {
  output: {
    distPath: {
      root: 'lib',
    },
    minify: true,
  },
  lib: [
    {
      format: 'esm',
      syntax: 'es2017',
      dts: {
        distPath: './lib/types',
      },
    },
  ],
};
