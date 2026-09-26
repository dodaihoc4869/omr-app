const fs = require('fs');

let code = fs.readFileSync('server/src/index.ts', 'utf8');

// We want to KEEP routes related to "Mở ca thi" and "Gọi lên bảng", and DB schema.
// We can just keep the exact methods `batDauThi`, `ghiLenBangMoi` and everything else we strip out.
// Wait, `index.ts` might be too complex to strip safely via regex.
// Can we just use TypeScript compiler API or Babel?
