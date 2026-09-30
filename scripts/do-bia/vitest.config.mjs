// ĐO MÁY CHỦ BI-A (không phải bộ test thường — `npx vitest run` mặc định KHÔNG chạy tệp này).
//   npx vitest run --config scripts/do-bia/vitest.config.mjs            (kết quả in ra + ghi DO_BIA_RA nếu đặt)
// D1 = node:sqlite trong bộ nhớ (tests/_d1-that.ts, đủ lược đồ migration) + độ trễ giả mỗi lượt D1 (DO_BIA_TRE_MS, mặc định 4 ms).
// TUYỆT ĐỐI không gọi máy chủ thật.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/do-bia/*.do.test.ts'],
    testTimeout: 600_000,
    hookTimeout: 600_000,
  },
})
