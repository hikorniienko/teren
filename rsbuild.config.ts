import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      example_01: './examples/example_01/index.ts',
    },
  },
  html: {
    title: 'Teren Examples',
  },
});
