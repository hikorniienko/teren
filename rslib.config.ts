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
      syntax: 'es2016',
      dts: {
        distPath: './lib/types',
      },
    },
  ],
};
