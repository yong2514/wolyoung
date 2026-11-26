import { defineConfig } from 'vite';

// GitHub Pages 주소는 https://<계정>.github.io/wolyoung/ 이라서 base를 저장소 이름에 맞춘다.
// 빌드·미리보기는 /wolyoung/, 개발 서버(npm run dev)는 '/' 그대로 쓴다.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/wolyoung/' : '/',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
}));
