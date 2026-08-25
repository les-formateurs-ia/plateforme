import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Pas de clé Gemini ici : cette appli tourne dans le navigateur de l'élève (iframe
// embarquée sur la plateforme), donc toute clé définie ici serait visible dans le
// code source par tous les élèves. Les appels Gemini passent par la edge function
// Supabase `tender-assistant-gemini`, qui garde la clé côté serveur — voir
// services/geminiService.ts.
export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
