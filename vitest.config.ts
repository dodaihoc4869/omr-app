import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Bộ test RUNTIME D1 (workerd) chạy bằng config riêng (`vitest.config.d1.ts` / `npm run test:d1`):
    // nó cần `cloudflare:test` + binding D1, không chạy được trong môi trường jsdom/node thường.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/d1-runtime-*.test.ts'],
  },
})
