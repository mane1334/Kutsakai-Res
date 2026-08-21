import { build } from 'vite';
import react from '@vitejs/plugin-react';

(async () => {
  try {
    console.log('Starting custom build...');
    await build({
      configFile: false,
      plugins: [react()],
      base: './',
      build: {
        outDir: 'dist',
        emptyOutDir: true,
      }
    });
    console.log('Build successful!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
})();
