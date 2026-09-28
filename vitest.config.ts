import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // KaTeX nạp lười trong app (28/09) — nạp sẵn trước mỗi tệp test để công thức dựng đồng bộ như trước.
    setupFiles: ['tests/_nap-katex.ts'],
    // Bộ test RUNTIME D1 (workerd) chạy bằng config riêng (`vitest.config.d1.ts` / `npm run test:d1`):
    // nó cần `cloudflare:test` + binding D1, không chạy được trong môi trường jsdom/node thường.
    // (Khớp `omr-app` — workspace này đang thiếu dòng `exclude` nên 6 tệp `d1-runtime-*` hiện ĐỎ giả.)
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/d1-runtime-*.test.ts'],
  },
})
