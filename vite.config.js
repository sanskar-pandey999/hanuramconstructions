import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist', // The folder where the minified files will be saved
    // Vite uses esbuild by default for minification,
    // so you don't always need to specify it unless you want to
    // customize the minifier.
    cssMinify: 'esbuild' 
  }
});