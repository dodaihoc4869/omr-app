// CẤU HÌNH VITEST CHO BỘ TEST RUNTIME D1 (RV06) — chạy trong workerd qua `@cloudflare/vitest-pool-workers`.
// API v0.22 (peer `vitest ^4.1`): cần CẢ hai — plugin `cloudflareTest(...)` (cấp module ảo `cloudflare:test`)
// và pool `cloudflarePool(...)` (chạy test TRONG workerd, có binding D1 của `wrangler.d1-test.toml`).
// Dùng RIÊNG file này (`npm run test:d1`) để bộ `vitest run` thường không phải khởi động runtime.
//
// LƯỢC ĐỒ: trong isolate workerd KHÔNG có hệ tệp, nên SQL được đọc Ở ĐÂY (Node) rồi truyền vào qua binding
// `LUOC_DO_SQL`; test gọi `env.DB.batch(...)` cho từng tệp.
// BỎ QUA `migration-1609-academic-start.sql`: tệp này phụ thuộc THỨ TỰ (cần `game_v2_settings` dựng trước) và
// không dùng tới trong bộ test này — giống bộ đệm `_d1-that.ts` (BO_QUA).
import { readFileSync, readdirSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import { cloudflarePool, cloudflareTest } from '@cloudflare/vitest-pool-workers'

const BO_QUA = new Set(['migration-1609-academic-start.sql'])
const luocDoSql = ['schema.sql', ...readdirSync('server').filter((f) => /^migration-.*\.sql$/.test(f)).sort()]
  .filter((f) => !BO_QUA.has(f))
  .map((f) => readFileSync(`server/${f}`, 'utf8'))

const tuyChon = {
  wrangler: { configPath: './wrangler.d1-test.toml' },
  // Một worker, KHÔNG cô lập storage theo từng test: test tự dựng lược đồ và tự làm sạch dữ liệu.
  singleWorker: true,
  isolatedStorage: false,
  miniflare: { bindings: { LUOC_DO_SQL: luocDoSql } },
} as const

export default defineConfig({
  plugins: [cloudflareTest(tuyChon)],
  test: {
    include: ['tests/d1-runtime-*.test.ts'],
    pool: cloudflarePool(tuyChon),
  },
})
